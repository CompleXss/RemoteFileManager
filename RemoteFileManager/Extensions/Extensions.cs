namespace RemoteFileManager.Extensions;

public static class Extensions
{
	public static string RemoveQuotationMarksIfPresent(this string value)
	{
		if (value.Length < 2)
			return value;

		if (value[0] == '\"' && value[^1] == '\"')
		{
			return value[1..^1];
		}

		return value;
	}
}
