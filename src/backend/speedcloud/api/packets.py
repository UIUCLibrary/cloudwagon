"""Module for managing packets."""

from __future__ import annotations
import contextlib
import typing
from collections import defaultdict
import json
from typing import (
    DefaultDict,
    Callable,
    Optional,
    TypeVar,
    TYPE_CHECKING,
    List,
    Union,
)

try:
    from typing import Unpack
except ImportError:
    from typing_extensions import Unpack

if TYPE_CHECKING:
    from speedcloud.job_manager import JobLog
    from speedcloud.api.schema import JobState, JobWorkflow
    from speedwagon.workflow import UserDataType as SpeedwagonParamsType


__all__ = ["PacketBuilder"]

T = TypeVar("T")


class PacketDataStructure(typing.TypedDict, total=False):
    job_id: Optional[str]
    job_parameters: typing.Dict[str, SpeedwagonParamsType]
    workflow: JobWorkflow
    start_time: str
    job_status: JobState
    logs: List[JobLog]
    progress: Optional[float]
    currentTask: Optional[str]


class PacketBuilder:
    """Packet builder for serializing data to be streamed."""

    def __init__(self) -> None:
        """Initialize no public data members."""
        super().__init__()
        self._data = PacketDataStructure()
        # self._data: Dict[str, PacketDataType] = {}
        self._update_strategies: DefaultDict[
            str, Callable[[Optional[T], T], T]
        ] = defaultdict(lambda: lambda existing_data, new_data: new_data)

    def add_items(self, **kwargs: Unpack[PacketDataStructure]) -> None:
        """Add items to the packet.

        Uses a key=value format. The key will be the key for the packet.

        Args:
            **kwargs:  key and value

        """
        for key, value in kwargs.items():
            if key not in PacketDataStructure.__annotations__.keys():
                raise ValueError(f"{key} is not a valid packet")
            existing_data = self._data.get(key)
            update_function = self._update_strategies[key]
            data = update_function(existing_data, value)
            self._data[key] = data  # type: ignore[literal-required]

    @staticmethod
    def serialize(data: PacketDataStructure) -> str:
        """Serialize data to a string.

        Args:
            data: Data to serialize.

        Returns: Returns the serialized data.

        """
        return json.dumps(data)

    def flush(self) -> Optional[str]:
        """Generate a new serialized packet and reset pending data."""
        if len(self._data.values()) == 0:
            return None

        result = self.serialize(self._data)
        self._data = PacketDataStructure()
        return result


class MemorizedPacketBuilder(PacketBuilder):
    def __init__(self) -> None:
        super().__init__()
        self._data_already_sent: DefaultDict[
            str, Union[None, PacketDataStructure]
        ] = defaultdict(lambda: None)

    def add_items(self, **kwargs: Unpack[PacketDataStructure]) -> None:
        for key, value in kwargs.items():
            if key not in PacketDataStructure.__annotations__.keys():
                raise ValueError(f"{key} is not a valid packet")
            existing_data = self._data_already_sent.get(key)
            update_function = self._update_strategies[key]
            data = update_function(existing_data, value)
            if existing_data != data:
                self._data[key] = data  # type: ignore[literal-required]

    def reset_memory(self) -> None:
        self._data_already_sent.clear()

    def prepare_new_data_packet(self) -> PacketDataStructure:
        new_data = PacketDataStructure()
        for key, value in self._data.items():
            if key not in PacketDataStructure.__annotations__.keys():
                raise ValueError(f"{key} is not a valid packet")
            if self._data_already_sent[key] != value:
                existing_data = self._data_already_sent[key]
                results = None if existing_data == new_data else value
                if results is not None:
                    new_data[key] = results  # type: ignore[literal-required]
        return new_data

    def flush(self) -> Optional[str]:
        if len(self._data.values()) == 0:
            return None
        new_data = self.prepare_new_data_packet()
        result = self.serialize(new_data)
        for key, value in new_data.items():
            self._data_already_sent[key] = value  # type: ignore[assignment]

        self._data = PacketDataStructure()
        # self._data.clear()
        return result


class LogMemorizer:
    def __init__(self) -> None:
        super().__init__()
        self._hashes: typing.Set[int] = set()

    def pass_through(
        self, logs: typing.Iterable[JobLog]
    ) -> typing.Iterator[JobLog]:
        for log in logs:
            hash_value = hash(str(log))
            if hash_value in self._hashes:
                continue
            yield log
            self._hashes.add(hash_value)

    def clear(self) -> None:
        self._hashes.clear()


@contextlib.contextmanager
def log_de_dup() -> typing.Generator[LogMemorizer, None, None]:
    memorizer = LogMemorizer()
    yield memorizer
    memorizer.clear()
