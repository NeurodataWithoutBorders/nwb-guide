## Phase 4: Synchronization Analysis

**Goal**: Understand how different data streams are temporally aligned and implement sync logic.

**Entry**: You know all data streams and interfaces from Phase 2.

**Exit criteria**: For every pair of data streams, you know:
- Whether they share a clock (same timestamps)
- If not, how to align them (TTL pulses, shared events, known offsets)
- The specific implementation plan for temporal alignment

### Why This Matters

NWB requires all data in a file to share a common time base. Different recording systems
often run on independent clocks that drift relative to each other. Without proper sync,
behavioral events won't align with neural data.

### Common Synchronization Patterns

**Pattern 1: Shared clock (simplest)**
- All data comes from the same system (e.g., SpikeGLX records both neural and NIDQ)
- Or all data was processed together with aligned timestamps
- Action: No sync needed — timestamps are already aligned

**Pattern 2: TTL pulse alignment**
- One system sends TTL pulses that are recorded by another
- E.g., behavior computer sends trial start TTLs recorded on SpikeGLX NIDQ channel
- Action: Extract TTL times from both streams, use as alignment anchors

```python
# In NWBConverter.temporally_align_data_interfaces():
from spikeinterface.extractors import SpikeGLXRecordingExtractor
nidq_recording = SpikeGLXRecordingExtractor(folder_path=path, stream_id="nidq")
nidq_data = nidq_recording.get_traces(channel_ids=["nidq#XA2"])
# Find rising edges
rising_edges = np.where(np.diff((nidq_data > threshold).astype(int)) > 0)[0]
ttl_times_neural = rising_edges / nidq_recording.get_sampling_frequency()

# Compare with behavioral event times to compute offset
offset = np.mean(ttl_times_neural[:n] - behavioral_event_times[:n])
```

**Pattern 3: Starting time offset**
- Streams start at different times but run at the same rate
- Action: Compute the offset and use `set_aligned_starting_time()`

```python
interface.set_aligned_starting_time(offset_seconds)
```

**Pattern 4: Interpolation between clocks**
- Streams run on different clocks that may drift
- Periodic sync pulses recorded by both systems
- Action: Use `align_by_interpolation()` with matched timepoints

```python
interface.align_by_interpolation(
    unaligned_timestamps=sync_times_in_this_clock,
    aligned_timestamps=sync_times_in_reference_clock
)
```

**Pattern 5: Frame-based alignment (imaging)**
- Behavioral data logged per imaging frame
- Action: Use imaging frame times as the time base

**Pattern 6: Multi-clock interpolation (complex)**
- Multiple independent clocks need cross-alignment (e.g., odor clock, behavior clock, imaging clock)
- Action: Chain interpolations through a reference clock

### Questions to Ask

> I need to understand how your data streams are synchronized:
>
> 1. Do all your recording systems share a common clock, or are they independent?
> 2. Do you use any synchronization signals (TTL pulses, sync LEDs, shared triggers)?
> 3. If so, which system generates the sync signal and which systems record it?
> 4. Is there a master clock that everything is referenced to?

Follow up based on answers:
- If TTL: Which channel? What does the pulse pattern mean? (rising edge = trial start?)
- If shared clock: How? (same DAQ, hardware sync, network time?)
- If no sync: Is approximate alignment acceptable? Do files have wall-clock timestamps?

### What to Record

Update `conversion_notes.md`:

```markdown
## Synchronization
- Reference clock: SpikeGLX neural recording
- Behavior → Neural: TTL pulses on NIDQ channel XA2, rising edge = epoch start
- Imaging → Neural: Frame trigger on NIDQ channel XA0
- Method: Compute mean offset from first N TTL events

### Sync Implementation Plan
Override `temporally_align_data_interfaces()` in the NWBConverter:
1. Read NIDQ channel XA2 from SpikeGLX
2. Find rising edges → neural epoch times
3. Compare with behavioral file epoch boundaries
4. Compute mean offset
5. Shift all behavioral timestamps by offset
```

### Push Phase 4 Results

After documenting the sync plan, commit and push:
```bash
git add conversion_notes.md
git commit -m "Phase 4: synchronization analysis — sync plan documented"
if git remote get-url origin &>/dev/null; then git push; fi
```
