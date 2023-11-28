from utils import post
from pathlib import Path


def test_generate_tutorial_data(client, tmp_path: Path):
    # assert client is None
    result = client.post(
        path="/tutorial/generate",
        json=dict(base_path=str(tmp_path)),
    )
    assert result is None
    assert len(list(Path(tmp_path).iterdir())) != 0
    assert (Path(tmp_path) / "spikeglx").exists()
    assert (Path(tmp_path) / "phy").exists()
