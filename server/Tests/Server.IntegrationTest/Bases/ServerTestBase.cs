using System.Diagnostics;

namespace Server.IntegrationTest.Bases
{
	public abstract class ServerTestBase : IDisposable
	{
		public Activity Activity { get; }

		public ServerTestBase()
		{
			Activity = new Activity("GlobalTestActivity");
			Activity.Start();
		}

		public void Dispose()
		{
			Activity.Stop();
		}
	}
}
