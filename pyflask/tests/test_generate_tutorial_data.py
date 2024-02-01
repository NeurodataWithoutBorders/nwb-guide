from utils import post
from pathlib import Path


def test_generate_test_data(client, tmp_path: Path):
    # assert client is None
    result = post(
        path="/data/generate",
        json=dict(output_path=str(tmp_path)),
        client=client
    )
    assert result is None
    assert len(list(Path(tmp_path).iterdir())) != 0
    assert (Path(tmp_path) / "spikeglx").exists()
    assert (Path(tmp_path) / "phy").exists()
