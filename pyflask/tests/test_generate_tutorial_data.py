from utils import post
from pathlib import Path


def test_generate_tutorial_data(client, tmp_path: Path):
    # assert client is None
    result = client.post(
        path="/tutorial/generate",
        # path=f"/tutorial/generate/base_path={tmp_path}",
        # json=dict(),
        json=dict(base_path=str(tmp_path)),
        # client=client,
    )
    assert result is None
    assert len(list(Path(tmp_path).iterdir())) != 0
    assert (Path(tmp_path) / "spikeglx").exists()
    assert (Path(tmp_path) / "phy").exists()
