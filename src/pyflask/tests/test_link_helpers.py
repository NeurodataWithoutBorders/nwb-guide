"""Unit tests for the cross-platform filesystem link helpers in manage_neuroconv.

These cover the fallbacks used on Windows once the app no longer runs as Administrator:
symlink, directory junction, and hard link, plus link removal that must never delete the
data the link points to.
"""

import os
import sys
import types

import pytest
from manageNeuroconv.manage_neuroconv import _is_link, _remove_link, create_link


def _make_dir_with_file(base, name="data"):
    target = base / name
    target.mkdir()
    (target / "keep.txt").write_text("important")
    return target


def _raise_oserror(*args, **kwargs):
    raise OSError("unavailable")


def test_create_link_creates_working_directory_link(tmp_path):
    target = _make_dir_with_file(tmp_path)
    link = tmp_path / "link"

    create_link(target, link, target_is_dir=True)

    assert _is_link(link)
    assert (link / "keep.txt").read_text() == "important"


def test_create_link_creates_working_file_link(tmp_path):
    target = tmp_path / "file.txt"
    target.write_text("payload")
    link = tmp_path / "link.txt"

    create_link(target, link, target_is_dir=False)

    assert link.read_text() == "payload"


def test_is_link_false_for_real_paths(tmp_path):
    real_dir = _make_dir_with_file(tmp_path)
    real_file = tmp_path / "plain.txt"
    real_file.write_text("x")

    assert not _is_link(real_dir)
    assert not _is_link(real_file)


def test_remove_link_preserves_directory_target(tmp_path):
    """Removing a directory link must leave the data it points to intact (data-loss regression)."""
    target = _make_dir_with_file(tmp_path)
    link = tmp_path / "link"
    create_link(target, link, target_is_dir=True)

    _remove_link(link)

    assert not link.exists()
    assert not _is_link(link)
    assert target.exists()
    assert (target / "keep.txt").read_text() == "important"


def test_remove_link_removes_file_link(tmp_path):
    target = tmp_path / "file.txt"
    target.write_text("payload")
    link = tmp_path / "link.txt"
    create_link(target, link, target_is_dir=False)

    _remove_link(link)

    assert not link.exists()
    assert target.read_text() == "payload"


def test_create_link_hardlink_fallback_for_files(tmp_path, monkeypatch):
    """On Windows without symlink privileges, files fall back to hard links."""
    target = tmp_path / "file.txt"
    target.write_text("payload")
    link = tmp_path / "link.txt"

    monkeypatch.setattr(sys, "platform", "win32")
    monkeypatch.setattr(os, "symlink", _raise_oserror)

    create_link(target, link, target_is_dir=False)

    assert link.read_text() == "payload"
    assert os.stat(link).st_ino == os.stat(target).st_ino  # a hard link shares the inode


def test_create_link_junction_fallback_for_directories(tmp_path, monkeypatch):
    """On Windows without symlink privileges, directories fall back to junctions with an absolute target."""
    original_symlink = os.symlink
    target = _make_dir_with_file(tmp_path)
    link = tmp_path / "link"

    recorded = {}

    def fake_create_junction(src, dst):
        recorded["target"] = src
        original_symlink(src, dst, target_is_directory=True)

    monkeypatch.setitem(sys.modules, "_winapi", types.SimpleNamespace(CreateJunction=fake_create_junction))
    monkeypatch.setattr(sys, "platform", "win32")
    monkeypatch.setattr(os, "symlink", _raise_oserror)

    create_link(target, link, target_is_dir=True)

    assert os.path.isabs(recorded["target"])
    assert (link / "keep.txt").read_text() == "important"


def test_create_link_raises_helpful_error_when_all_fallbacks_fail(tmp_path, monkeypatch):
    target = tmp_path / "file.txt"
    target.write_text("payload")
    link = tmp_path / "link.txt"

    monkeypatch.setattr(sys, "platform", "win32")
    monkeypatch.setattr(os, "symlink", _raise_oserror)
    monkeypatch.setattr(os, "link", _raise_oserror)

    with pytest.raises(OSError, match="Administrator"):
        create_link(target, link, target_is_dir=False)
