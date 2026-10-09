-- Security advisor: functions without a fixed search_path.
alter function public.today_ist() set search_path = public;
alter function public.touch_updated_at() set search_path = public;
