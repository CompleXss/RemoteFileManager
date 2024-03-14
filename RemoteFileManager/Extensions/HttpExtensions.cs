using System.Diagnostics.CodeAnalysis;

namespace RemoteFileManager.Extensions;

public static class HttpExtensions
{
	public static async Task<HttpResponseMessage> ReadResponseHeaders(this HttpClient client, Uri uri, CancellationToken token)
	{
		return await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, token);
	}

	public static bool TryGetFileName(this HttpResponseMessage response, [NotNullWhen(true)] out string? filename)
	{
		if (response.RequestMessage is null || response.RequestMessage.RequestUri is null)
		{
			filename = null;
			return false;
		}

		Uri uri = response.RequestMessage.RequestUri;
		var ctxDisposition = response.Content.Headers.ContentDisposition;

		filename =
			ctxDisposition?.FileNameStar?.RemoveQuotationMarksIfPresent()
			?? ctxDisposition?.FileName?.RemoveQuotationMarksIfPresent()
				?? Path.GetFileName(uri.LocalPath);

		return true;
	}
}
