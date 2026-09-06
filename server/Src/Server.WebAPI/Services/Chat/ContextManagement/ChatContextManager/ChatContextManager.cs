using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update.Internal;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.MakeCall;
using Server.WebAPI.Models.LLM.Responses.SendEmail;
using Server.WebAPI.Models.LLM.Responses.SendSMS;
using Server.WebAPI.Models.LLM.Responses.SetAlram;
using Server.WebAPI.Models.LLM.Responses.SetCalendar;
using System.Text.Json;

namespace Server.WebAPI.Services.Chat.ContextManagement.ChatContextManager
{
	public class ChatContextManager : IChatContextManager
	{
		private readonly ServerDbContext _serverDbContext;

		public ChatContextManager(ServerDbContext serverDbContext)
		{
			_serverDbContext = serverDbContext;
		}
		public async Task<ChatContext> GetOrCreateContext(ChatTaskDto task, CancellationToken cancellationToken = default)
		{
			var chatContext = await _serverDbContext.ChatContexts.FirstOrDefaultAsync(c => c.ChatId == task.ChatId);

			if(chatContext == null)
			{
				chatContext = new ChatContext()
				{
					ChatId = task.ChatId,
					ActiveTask = new ActiveTask()
					{
						Intent = string.IsNullOrEmpty(task.Intention) ? PromptsNames.None : task.Intention,
						//FilledSlots = new(),
						MissingSlots = new(),
						Status = Status.InProgress,
					},
					Payload = new(),
				};

				_serverDbContext.ChatContexts.Add(chatContext);
				await _serverDbContext.SaveChangesAsync();
			}

			if(chatContext.ActiveTask.Status == Status.Done)
			{
				chatContext.ActiveTask = new ActiveTask()
				{
					Intent = string.IsNullOrEmpty(task.Intention) ? PromptsNames.None : task.Intention,
					//FilledSlots = new(),
					MissingSlots = new(),
					Status = Status.InProgress,
				};
				chatContext.Payload = new();

				_serverDbContext.ChatContexts.Update(chatContext);
				await _serverDbContext.SaveChangesAsync();
			}

			return chatContext;
		}
		public async Task<ChatContext> UpdateContext(ChatTaskDto task, string processorResult, PishkarContext pishkarContext, CancellationToken cancellationToken = default)
		{
			var chatContext = await _serverDbContext.ChatContexts.FirstOrDefaultAsync(c => c.ChatId == task.ChatId);

			if(chatContext == null)
			{
				throw new Exception($"ChatContext could not be null ({JsonSerializer.Serialize(task)})");
			}

			if(chatContext.ActiveTask.Intent == PromptsNames.None)
			{
				if(string.IsNullOrEmpty(task.Intention))
				{
					throw new Exception($"Intention should not be empty ({JsonSerializer.Serialize(task)})");
				}

				chatContext.ActiveTask.Intent = task.Intention;
			}

			chatContext.ActiveTask.UserLanguage ??= task.UserLanguage;

			// TODO: use dictionary instead of dirty works
			UpdateSlots(task, processorResult, pishkarContext);

			if(pishkarContext.ChatContext.ActiveTask.MissingSlots.Count > 0)
			{
				pishkarContext.ChatContext.ActiveTask.Status = Status.MissingInfo;
			}
			// TODO:
			else
			{
				pishkarContext.ChatContext.ActiveTask.Status = Status.Done;
			}

			await _serverDbContext.SaveChangesAsync();

			return chatContext;
		}

		public async Task UpdateChatContextIntent(ChatTaskDto task, PishkarContext pishkarContext, CancellationToken cancellationToken = default)
		{
			var chatContext = await _serverDbContext.ChatContexts.FirstOrDefaultAsync(c => c.ChatId == task.ChatId);

			if(chatContext == null)
			{
				throw new Exception($"ChatContext could not be null ({JsonSerializer.Serialize(task)})");
			}

			if(chatContext.ActiveTask.Intent == PromptsNames.None)
			{
				if(string.IsNullOrEmpty(task.Intention))
				{
					throw new Exception($"Intention should not be empty ({JsonSerializer.Serialize(task)})");
				}

				chatContext.ActiveTask.Intent = task.Intention;
			}

			chatContext.ActiveTask.UserLanguage ??= task.UserLanguage;

			await _serverDbContext.SaveChangesAsync();
		}

		private bool UpdateSlots(ChatTaskDto chatTaskDto, string processorResult, PishkarContext pishkarContext)
		{
			try
			{
				if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.SetAlarm)
				{
					SetAlarmUpdateSlot(processorResult, pishkarContext);
				}
				else if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.SetCalendar)
				{
					SetCalendarUpdateSlot(processorResult, pishkarContext);
				}
				else if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.MakeCall)
				{
					MakeCallUpdateSlot(processorResult, pishkarContext);
				}
				else if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.SendSMS)
				{
					SendSMSUpdateSlot(processorResult, pishkarContext);
				}
				else if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.SendEmail)
				{
					SendEmailUpdateSlot(processorResult, pishkarContext);
				}
				//else if(pishkarContext.ChatContext.ActiveTask.Intent == PromptsNames.ConsultingOnBuy)
				//{

				//}

				return false;
			}
			catch(Exception ex)
			{
				throw;
			}
		}

		private void SetAlarmUpdateSlot(string processorResult, PishkarContext pishkarContext)
		{
			var chatContext = pishkarContext.ChatContext;

			var json = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(processorResult);

			if(json == null)
			{
				throw new Exception($"The deserialized of the llm response is null ({processorResult})");
			}

			chatContext.ActiveTask.MissingSlots = json.Missing.ToList();

			if(IsMissing(json.Missing, nameof(json.Alarm.Minutes)) == false)
			{
				chatContext.Payload[nameof(json.Alarm.Minutes).ToLower()] = json.Alarm.Minutes.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Alarm.Hour)) == false)
			{
				chatContext.Payload[nameof(json.Alarm.Hour).ToLower()] = json.Alarm.Hour.ToString();
			}

			pishkarContext.ChatContext.UpdatedAt = DateTime.Now;
		}

		private void SetCalendarUpdateSlot(string processorResult, PishkarContext pishkarContext)
		{
			var chatContext = pishkarContext.ChatContext;

			var json = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(processorResult);

			if(json == null)
			{
				throw new Exception($"The deserialized of the llm response is null ({processorResult})");
			}

			chatContext.ActiveTask.MissingSlots = json.Missing.ToList();

			if(IsMissing(json.Missing, nameof(json.Event.Title)) == false)
			{
				chatContext.Payload[nameof(json.Event.Title).ToLower()] = json.Event.Title.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Date)) == false)
			{
				chatContext.Payload[nameof(json.Event.Date).ToLower()] = json.Event.Date.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Start)) == false)
			{
				chatContext.Payload[nameof(json.Event.Start).ToLower()] = json.Event.Start.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.End)) == false && string.IsNullOrEmpty(json.Event.End) == false)
			{
				chatContext.Payload[nameof(json.Event.End).ToLower()] = json.Event.End.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Location)) == false && string.IsNullOrEmpty(json.Event.Location) == false)
			{
				chatContext.Payload[nameof(json.Event.Location).ToLower()] = json.Event.Location.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Attendees)) == false)
			{
				if(json.Event.Attendees.Count > 0)
					chatContext.Payload[nameof(json.Event.Attendees).ToLower()] = json.Event.Attendees.Aggregate((s1, s2) => $"{s1},{s2}").ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Recurrence)) == false && string.IsNullOrEmpty(json.Event.Recurrence) == false)
			{
				chatContext.Payload[nameof(json.Event.Recurrence).ToLower()] = json.Event.Recurrence.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Event.Notes)) == false && string.IsNullOrEmpty(json.Event.Notes) == false)
			{
				chatContext.Payload[nameof(json.Event.Notes).ToLower()] = json.Event.Notes.ToString();
			}

			pishkarContext.ChatContext.UpdatedAt = DateTime.Now;
		}

		private void MakeCallUpdateSlot(string processorResult, PishkarContext pishkarContext)
		{
			var chatContext = pishkarContext.ChatContext;

			var json = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(processorResult);

			if(json == null)
			{
				throw new Exception($"The deserialized of the llm response is null ({processorResult})");
			}

			chatContext.ActiveTask.MissingSlots = json.Missing.ToList();

			if(IsMissing(json.Missing, nameof(json.Call.PhoneNumber)) == false && json.Call.PhoneNumber != null)
			{
				chatContext.Payload[nameof(json.Call.PhoneNumber).ToLower()] = json.Call.PhoneNumber.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Call.Contact)) == false && json.Call.Contact != null)
			{
				chatContext.Payload[nameof(json.Call.Contact).ToLower()] = json.Call.Contact.ToString();
			}

			pishkarContext.ChatContext.UpdatedAt = DateTime.Now;
		}

		private void SendSMSUpdateSlot(string processorResult, PishkarContext pishkarContext)
		{
			var chatContext = pishkarContext.ChatContext;

			var json = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(processorResult);

			if(json == null)
			{
				throw new Exception($"The deserialized of the llm response is null ({processorResult})");
			}

			chatContext.ActiveTask.MissingSlots = json.Missing.ToList();

			if(IsMissing(json.Missing, nameof(json.Message)) == false)
			{
				chatContext.Payload[nameof(json.Message).ToLower()] = json.Message.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.PhoneNumber)) == false && json.PhoneNumber != null)
			{
				chatContext.Payload[nameof(json.PhoneNumber).ToLower()] = json.PhoneNumber.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.ContactName)) == false && json.ContactName != null)
			{
				chatContext.Payload[nameof(json.ContactName).ToLower()] = json.ContactName.ToString();
			}

			pishkarContext.ChatContext.UpdatedAt = DateTime.Now;
		}

		private void SendEmailUpdateSlot(string processorResult, PishkarContext pishkarContext)
		{
			var chatContext = pishkarContext.ChatContext;

			var json = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(processorResult);

			if(json == null)
			{
				throw new Exception($"The deserialized of the llm response is null ({processorResult})");
			}

			chatContext.ActiveTask.MissingSlots = json.Missing.ToList();

			if(IsMissing(json.Missing, nameof(json.Body)) == false)
			{
				chatContext.Payload[nameof(json.Body).ToLower()] = json.Body.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Email)) == false)
			{
				chatContext.Payload[nameof(json.Email).ToLower()] = json.Email.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Subject)) == false)
			{
				chatContext.Payload[nameof(json.Subject).ToLower()] = json.Subject.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Cc)) == false && string.IsNullOrEmpty(json.Cc) == false)
			{
				chatContext.Payload[nameof(json.Cc).ToLower()] = json.Cc.ToString();
			}

			if(IsMissing(json.Missing, nameof(json.Bcc)) == false && string.IsNullOrEmpty(json.Bcc) == false)
			{
				chatContext.Payload[nameof(json.Bcc).ToLower()] = json.Bcc.ToString();
			}

			pishkarContext.ChatContext.UpdatedAt = DateTime.Now;
		}

		private static bool IsMissing(List<string> missingList, string slot)
		{
			return missingList.Select(m => m.ToLower()).Contains(slot.ToLower());
		}
	}
}
