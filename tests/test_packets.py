import json
import pytest

from speedcloud.job_manager import JobLog
from speedcloud.api import packets


class TestPackageGenerator:
    @pytest.fixture()
    def packet_generator(self):
        return packets.PacketBuilder()

    def test_flush(self, packet_generator):
        packet_generator.add_items(job_id='18b04b13-cae5-4849-8ffe-fbe241ec5390')
        result = packet_generator.flush()
        assert json.loads(result)['job_id'] == '18b04b13-cae5-4849-8ffe-fbe241ec5390'

    def test_post_flush_is_none(self, packet_generator):
        packet_generator.add_items(job_id='18b04b13-cae5-4849-8ffe-fbe241ec5390')
        packet_generator.flush()
        result = packet_generator.flush()
        assert result is None

    def test_add_items_with_multiple_statements(self, packet_generator):
        packet_generator.add_items(job_id='18b04b13-cae5-4849-8ffe-fbe241ec5390')
        packet_generator.add_items(progress=10.2)
        assert json.loads(packet_generator.flush()) == {
            'progress': 10.2,
            'job_id': '18b04b13-cae5-4849-8ffe-fbe241ec5390'
        }

class TestMemorizedPackageGenerator:
    @pytest.fixture()
    def packet_generator(self):
        return packets.MemorizedPacketBuilder()

    def test_doesnt_resend_already_sent_data(self, packet_generator):
        packet_generator.add_items(job_id='18b04b13-cae5-4849-8ffe-fbe241ec5390')
        packet_generator.flush()
        packet_generator.add_items(job_id='18b04b13-cae5-4849-8ffe-fbe241ec5390')
        packet_generator.add_items(progress=10.2)
        assert json.loads(packet_generator.flush()) == {
            'progress': 10.2,
        }

    def test_doesnt_resend_already_sent_data2(self, packet_generator):
        packet_generator.add_items(
            currentTask='Validating OCR Files in /Users/hborcher/PycharmProjects/UIUCLibrary/dockerSpeedwagon2/dockerSpeedwagon/storage/sample data/Brittle Books - Good/1747383v59',
            progress=88.89
        )
        packet_generator.flush()
        packet_generator.add_items(
            currentTask='Validating OCR Files in /Users/hborcher/PycharmProjects/UIUCLibrary/dockerSpeedwagon2/dockerSpeedwagon/storage/sample data/Brittle Books - Good/1747383v59',
            progress=88.89
        )
        assert packet_generator.flush() is None

    @pytest.fixture()
    def flushed_data(self):
        return {'job_id': '18b04b13-cae5-4849-8ffe-fbe241ec5390'}

    @pytest.fixture()
    def package_generator_already_flushed(self, packet_generator, flushed_data):
        packet_generator.add_items(**flushed_data)
        packet_generator.flush()
        return packet_generator

    def test_reset_memory_after_adding_will_allow_for_resending_data(
            self,
            package_generator_already_flushed,
            flushed_data
    ):
        package_generator_already_flushed.add_items(
            **flushed_data,
            progress=10.2
        )
        package_generator_already_flushed.reset_memory()

        package_generator_already_flushed.add_items(
            **flushed_data,
            progress=10.2
        )
        assert json.loads(package_generator_already_flushed.flush()) == {
            'progress': 10.2,
            'job_id': '18b04b13-cae5-4849-8ffe-fbe241ec5390'
        }

    def test_reset_memory_before_adding_will_allow_for_resending_data(
            self,
            package_generator_already_flushed,
            flushed_data
    ):
        package_generator_already_flushed.reset_memory()

        package_generator_already_flushed.add_items(
            **flushed_data,
            progress=10.2
        )

        assert json.loads(package_generator_already_flushed.flush()) == {
            'progress': 10.2,
            'job_id': '18b04b13-cae5-4849-8ffe-fbe241ec5390'
        }
class TestLogMemorizer:
    def test_single_item(self):
        log_memorizer = packets.LogMemorizer()
        result = list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234)
                ]
            )
        )
        assert len(result) == 1

    def test_two_different_items(self):
        log_memorizer = packets.LogMemorizer()
        result = list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),
                    JobLog(msg="something else", time=1235),
                ]
            )
        )
        assert len(result) == 2

    def test_multiple_calls_finds_dups(self):
        log_memorizer = packets.LogMemorizer()
        result = list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),

                ]
            )
        )
        result += list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),
                ]
            )
        )
        assert len(result) == 1

    def test_duplicate_items(self):
        log_memorizer = packets.LogMemorizer()
        result = list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),

                ]
            )
        )
        result += list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),
                ]
            )
        )
        assert len(result) == 1

    def test_clear(self):
        log_memorizer = packets.LogMemorizer()
        result = list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),

                ]
            )
        )
        log_memorizer.clear()
        result += list(
            log_memorizer.pass_through(
                [
                    JobLog(msg="something", time=1234),
                ]
            )
        )
        assert len(result) == 2


def test_log_de_dup_context_manager():
    results = []
    with packets.log_de_dup() as memorizier:

        results += memorizier.pass_through([ JobLog(msg="something", time=1234)])
        results += memorizier.pass_through(
            [
                JobLog(msg="something", time=1234),
                JobLog(msg="something", time=1234),
            ]
        )
    assert len(results) == 1