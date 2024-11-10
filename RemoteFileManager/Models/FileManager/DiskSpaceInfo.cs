namespace RemoteFileManager.Models.FileManager;

public readonly struct DiskSpaceInfo(long free, long total)
{
	public long Free { get; init; } = free;
	public long Total { get; init; } = total;
}
