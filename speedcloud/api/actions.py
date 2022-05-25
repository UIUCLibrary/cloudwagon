import speedwagon
from typing import List


def get_workflows() -> List[str]:
    return list(speedwagon.available_workflows().keys())
