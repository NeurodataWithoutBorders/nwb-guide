from utils import post
from pathlib import Path


def test_generate_tutorial_data(tmp_path, client):
    post(f"tutorial/generate/{tmp_path}", tmp_path, client)
    assert (Path(tmp_path) / "spikeglx").exists()
    assert (Path(tmp_path) / "phy").exists()
