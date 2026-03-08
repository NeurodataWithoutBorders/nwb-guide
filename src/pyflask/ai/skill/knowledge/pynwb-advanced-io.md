# Advanced I/O — PyNWB Patterns

Patterns for efficient storage of large datasets.

## H5DataIO — Compression and Chunking

```python
from hdmf.backends.hdf5.h5_utils import H5DataIO

# Basic gzip compression (good default)
compressed = H5DataIO(data=large_array, compression="gzip")

# Higher compression level (1-9, default 4)
compressed = H5DataIO(data=large_array, compression="gzip", compression_opts=9)

# LZF — faster compression/decompression, lower ratio
compressed = H5DataIO(data=large_array, compression="lzf")

# Custom chunk shape (important for access patterns)
compressed = H5DataIO(
    data=large_array,                    # shape: (n_frames, height, width)
    compression="gzip",
    chunks=(1, height, width),           # one frame per chunk for frame-by-frame access
)

# For time series data — chunk along time axis
compressed = H5DataIO(
    data=traces,                         # shape: (n_timepoints, n_channels)
    compression="gzip",
    chunks=(10000, n_channels),          # 10k timepoints per chunk
)
```

## DataChunkIterator — Datasets Too Large for Memory

When data doesn't fit in RAM, use `DataChunkIterator` to stream data during write:

```python
from hdmf.data_utils import DataChunkIterator

def data_generator():
    """Yield one chunk at a time from files on disk."""
    for file_path in sorted(data_files):
        chunk = np.load(file_path)       # load one chunk at a time
        yield chunk

data_iterator = DataChunkIterator(
    data=data_generator(),
    maxshape=(None, n_channels),         # None = unlimited along first dim
    dtype=np.float32,
)

ts = TimeSeries(
    name="large_recording",
    data=H5DataIO(data_iterator, compression="gzip"),
    rate=30000.0,
    unit="volts",
)
nwbfile.add_acquisition(ts)
```

## GenericDataChunkIterator — From Existing Arrays

For arrays that are already memory-mapped (e.g., from HDF5 or memmap):

```python
from hdmf.data_utils import GenericDataChunkIterator

class MyIterator(GenericDataChunkIterator):
    def _get_data(self, selection):
        return my_memmap[selection]

    def _get_maxshape(self):
        return my_memmap.shape

    def _get_dtype(self):
        return my_memmap.dtype

iterator = MyIterator(buffer_gb=1.0)     # process 1 GB at a time
```

## When to Use Each Approach

| Data Size | Approach |
|-----------|----------|
| < 1 GB | `H5DataIO(data=array, compression="gzip")` |
| 1-10 GB | `H5DataIO` with explicit `chunks` tuned for access pattern |
| > 10 GB | `DataChunkIterator` or `GenericDataChunkIterator` to stream |
| Memory-mapped source | `GenericDataChunkIterator` subclass |

## Notes

- Always use compression for large datasets. `gzip` is the safest default (universally
  supported). `lzf` is faster but HDF5-specific.
- Chunk shape should match the most common access pattern: if you read frames one at a
  time, chunk by frame; if you read channels, chunk by channel.
- `maxshape=(None, ...)` allows the dataset to be extended along the first dimension.
- The `buffer_gb` parameter on `GenericDataChunkIterator` controls memory usage.
