using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Config;

namespace Server.WebAPI.Web.Extensions
{
	public static class ServiceDependencyExtension
	{
		public static IServiceCollection AddServiceDependencies(this IServiceCollection services, ServerSetting serverSetting)
		{
			services.Scan(scan => scan.FromAssembliesOf(typeof(Program))
				.AddClasses(classes => classes.AssignableTo<ITransientService>())
				.AsImplementedInterfaces()
				.WithTransientLifetime());

			services.Scan(scan => scan.FromAssembliesOf(typeof(Program))
				.AddClasses(classes => classes.AssignableTo<IScopedService>())
				.AsImplementedInterfaces()
				.WithScopedLifetime());

			return services;
		}
	}
}
