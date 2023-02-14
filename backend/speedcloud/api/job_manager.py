from __future__ import annotations
from typing import Dict, Any

import speedwagon
from .. import runner
from . import actions


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


def _fixup_props(props, workflow):
    parameters = workflow['parameters']
    new_props = props.copy()
    for p in parameters:
        if p['widget_type'] == 'BooleanSelect':
            property_key = p['label']
            og_value = props[property_key]

            new_value = \
                {
                    'true': True,
                    'True': True,
                    'false': False,
                    'False': False,
                }.get(og_value)
            if new_value is None:
                new_value = og_value
            new_props[property_key] = new_value
    return new_props


def create_job(workflow_id, props, netloc):
    # TODO: make the console dynamically point to the right stream
    job_id = len(jobs)
    job = {
        "status": fake_data_streamer,
        "metadata": {
            "id": job_id,
            "workflow_id": workflow_id,
            "properties": _fixup_props(
                props,
                actions.get_workflow_by_id(workflow_id)
            ),
            'consoleStreamWS':
                f"ws://{netloc}/stream?job_id={job_id}",
            'consoleStreamSSE':
                f"http://{netloc}/stream?job_id={job_id}",
        }
    }
    jobs[job['metadata']['id']] = job
    return job['metadata']
