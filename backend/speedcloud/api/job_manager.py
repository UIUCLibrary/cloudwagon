from __future__ import annotations
from typing import Dict, Any

import speedwagon
from .. import runner


jobs: Dict[int, Any] = {}


async def fake_data_streamer():
    workflows = speedwagon.available_workflows()
    workflow = workflows['Verify HathiTrust Package Completeness']
    options = {
                "Source": "/Users/hborcher/sample data/Brittle Books - Good/",
                "Check for page_data in meta.yml": True,
                "Check ALTO OCR xml files": True,
                "Check OCR xml files are utf-8": True
            }
    total_packets = 0
    yield {
        "order": total_packets,
        'log': 'starting',
        'progress': 0,
    }
    total_packets += 1
    job_runner = runner.JobRunner()
    async for packet in job_runner.iter_job(workflow(), options):
        a = {}
        print(packet)
        if packet.task:
            a['packet'] = packet.task
        if packet.progress:
            a['progress'] = packet.progress
        if packet.log:
            a['log'] = packet.log
        yield {
            **a,
            # **packet,
            **{
                "order": total_packets
            }
        }
        total_packets += 1
        # job_runner.abort = True


def create_job(workflow_id, props):
    # todo: make the console dynamically point to the right stream
    job_id = len(jobs)
    job = {
        "status": fake_data_streamer,
        "metadata": {
            "id": job_id,
            "workflow_id": workflow_id,
            "properties": props,
            'consoleStreamWS':
                f"ws://localhost:8000/api/stream?job_id={job_id}",
            'consoleStreamSSE':
                f"http://localhost:8000/api/stream?job_id={job_id}",
        }
    }
    jobs[job['metadata']['id']] = job
    return job['metadata']
