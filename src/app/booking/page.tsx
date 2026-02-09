'use client';

import { useState, useMemo } from 'react';
import {
  Building2, ArrowRight, CalendarDays, Clock, User, Phone, Mail,
  ChevronLeft, ChevronRight, Check, CreditCard, MapPin,
} from 'lucide-react';
import {
  addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isBefore, getDay, addMonths,
  startOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const TIME_SLOTS = ['20:00', '20:45'];
const MEETING_PRICE = 3000;
const MEETING_DURATION = 45;

const WEEKDAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export default function BookingPage() {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'calendar' | 'form' | 'confirm'>('calendar');
  const [form, setForm] = useState({ name: '', phone: '', email: '', project: '' });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const isAvailable = (date: Date) => {
    if (isBefore(date, today)) return false;
    if (getDay(date) === 6) return false; // Saturday
    const maxDate = addDays(today, 60);
    if (isBefore(maxDate, date)) return false;
    return true;
  };

  const handleDateClick = (date: Date) => {
    if (!isAvailable(date)) return;
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
    setStep('form');
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.email) return;
    setStep('confirm');
  };

  const bookingMailto = () => {
    const dateStr = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '';
    const subject = encodeURIComponent(`תיאום פגישת ייעוץ - ${dateStr} ${selectedTime}`);
    const body = encodeURIComponent(
      `שלום חיים,\n\nאני רוצה לתאם פגישת ייעוץ:\nשם: ${form.name}\nטלפון: ${form.phone}\nאימייל: ${form.email}\nפרויקט: ${form.project || 'לא צוין'}\nתאריך: ${dateStr}\nשעה: ${selectedTime}\n\nתודה.`
    );
    return `mailto:contact@haim-checkup.co.il?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="bg-video bg-cinematic" poster={FALLBACK_IMG}>
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-cinematic bg-cover bg-center" style={{ backgroundImage: `url('${FALLBACK_IMG}')` }} />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border)] sticky top-0" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-green" />
            <span className="font-bold text-sm">THE REALITY CHECK</span>
            <span className="text-foreground-muted text-xs">{'| קביעת פגישה'}</span>
          </div>
          <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            {'חזרה'}<ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 flex-1">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{'פגישת ייעוץ אסטרטגית'}</h1>
          <p className="text-sm text-foreground-muted">{'45 דקות של בדיקת נאותות ממוקדת עם חיים פיין | עלות: '}{MEETING_PRICE.toLocaleString('he-IL')}{' \u20AA'}</p>
        </div>

        {step === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3 db-card p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                  <ChevronRight className="w-4 h-4 text-foreground-muted" />
                </button>
                <h3 className="text-sm font-bold text-foreground">{format(currentMonth, 'MMMM yyyy', { locale: he })}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                  <ChevronLeft className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-foreground-muted mb-2">
                {WEEKDAY_NAMES.map((d) => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  const available = isAvailable(day);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, today);

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(day)}
                      disabled={!available || !inMonth}
                      className="relative h-10 rounded-lg text-xs font-medium transition-all"
                      style={{
                        opacity: !inMonth ? 0.15 : !available ? 0.3 : 1,
                        background: selected ? 'var(--accent)' : 'transparent',
                        color: selected ? '#fff' : isToday ? 'var(--green)' : 'var(--fg-primary)',
                        cursor: available && inMonth ? 'pointer' : 'default',
                        border: isToday && !selected ? '1px solid var(--green)' : '1px solid transparent',
                      }}
                    >
                      {format(day, 'd')}
                      {available && inMonth && !selected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 text-[10px] text-foreground-muted">
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green" />{'פנוי'}</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" />{'נבחר'}</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-dim)]" />{'לא זמין (שבת)'}</div>
              </div>
            </div>

            {/* Time Slots + Info */}
            <div className="lg:col-span-2 space-y-4">
              {selectedDate ? (
                <div className="db-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {format(selectedDate, 'EEEE, d MMMM', { locale: he })}
                  </h3>
                  <p className="text-xs text-foreground-muted mb-4">{'בחר שעה:'}</p>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeClick(time)}
                        className="w-full db-card p-3 flex items-center justify-between hover:border-accent/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold">{time}</span>
                        </div>
                        <span className="text-[10px] text-foreground-muted">{MEETING_DURATION}{' דק׳'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="db-card p-5 text-center">
                  <CalendarDays className="w-8 h-8 text-foreground-muted opacity-30 mx-auto mb-3" />
                  <p className="text-xs text-foreground-muted">{'בחר תאריך מהיומן'}</p>
                </div>
              )}

              <div className="db-card p-5 space-y-3 text-xs text-foreground-muted">
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-green" />{'משך: 45 דקות'}</div>
                <div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-green" />{'עלות: '}{MEETING_PRICE.toLocaleString('he-IL')}{' \u20AA'}</div>
                <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-green" />{'זמינות: כל יום מ-20:00'}</div>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && selectedDate && (
          <div className="max-w-lg mx-auto db-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">{'פרטי ההזמנה'}</h3>
            <p className="text-xs text-foreground-muted mb-6">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}{' | '}{selectedTime}{' | '}{MEETING_DURATION}{' דק׳'}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><User className="w-3 h-3" />{'שם מלא *'}</label>
                <input className="input-field text-right text-sm" placeholder="ישראל ישראלי" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Phone className="w-3 h-3" />{'טלפון *'}</label>
                <input className="input-field text-right text-sm" type="tel" placeholder="050-1234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Mail className="w-3 h-3" />{'אימייל *'}</label>
                <input className="input-field text-right text-sm" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{'כתובת הפרויקט (אופציונלי)'}</label>
                <input className="input-field text-right text-sm" placeholder="עיר, רחוב" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('calendar')} className="btn-secondary py-3 px-4 rounded-lg text-sm flex-1">{'חזרה ליומן'}</button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.name || !form.phone || !form.email}
                  className="btn-primary py-3 px-4 rounded-lg text-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {'המשך לתשלום'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedDate && (
          <div className="max-w-lg mx-auto db-card-green p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{'הפגישה נקבעה!'}</h3>
            <p className="text-sm text-foreground-muted mb-4">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}{' בשעה '}{selectedTime}
            </p>

            <div className="db-card p-4 text-right text-xs text-foreground-muted space-y-1 mb-6">
              <div><span className="font-semibold text-foreground-secondary">{'שם: '}</span>{form.name}</div>
              <div><span className="font-semibold text-foreground-secondary">{'טלפון: '}</span>{form.phone}</div>
              <div><span className="font-semibold text-foreground-secondary">{'אימייל: '}</span>{form.email}</div>
              {form.project && <div><span className="font-semibold text-foreground-secondary">{'פרויקט: '}</span>{form.project}</div>}
            </div>

            <a href={bookingMailto()} className="btn-primary py-3 px-6 rounded-lg text-sm inline-flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {'שלח פרטים ותשלום — '}{MEETING_PRICE.toLocaleString('he-IL')}{' \u20AA'}
            </a>

            <p className="text-[10px] text-foreground-muted mt-4">{'לחיצה על הכפתור תפתח את האימייל שלך עם פרטי ההזמנה.'}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{'by Haim Finn'}</span>
      </div>
    </div>
  );
}
