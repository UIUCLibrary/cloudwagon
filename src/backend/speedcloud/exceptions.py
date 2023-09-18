"""Custom exceptions."""


class SpeedCloudException(Exception):
    """CloudWagon base Exception."""


class JobAlreadyAborted(SpeedCloudException):
    """Job has already aborted."""

    def __init__(self, job_id, *args: object) -> None:
        """Create a new exception for jobs already aborted.

        Args:
            job_id: Identity of job attempted to be aborted.
            *args:
        """
        super().__init__(*args)
        self.job_id = job_id
