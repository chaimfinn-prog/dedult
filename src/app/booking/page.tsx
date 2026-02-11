'use client';

import { useState, useMemo } from 'react';
import {
  Building2, ArrowRight, CalendarDays, Clock, User, Phone, Mail,
  ChevronLeft, ChevronRight, Check, CreditCard, MapPin, Globe, Loader2,
} from 'lucide-react';
import {
  addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, isBefore, getDay, addMonths,
  startOfDay,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { useLang } from '@/lib/i18n';

const VIDEO_SRC = 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_25fps.mp4';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80';

const TIME_SLOTS = ['20:00', '20:45'];
const MEETING_PRICE = 3000;
const MEETING_DURATION = 45;

const WEEKDAY_NAMES_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingPage() {
  const { lang, toggle } = useLang();
  const t = (he: string, en: string) => lang === 'he' ? he : en;

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'calendar' | 'form' | 'confirm'>('calendar');
  const [form, setForm] = useState({ name: '', phone: '', email: '', project: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const weekdayNames = lang === 'he' ? WEEKDAY_NAMES_HE : WEEKDAY_NAMES_EN;

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

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email) return;
    setSending(true);
    setSendError('');
    try {
      const dateStr = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '';
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking',
          formData: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            project: form.project || null,
            date: dateStr,
            time: selectedTime,
            duration: MEETING_DURATION,
            price: MEETING_PRICE,
          },
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setStep('confirm');
    } catch {
      setSendError(t('שגיאה בשליחה. נסה שוב.', 'Sending failed. Please try again.'));
    } finally {
      setSending(false);
    }
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
            <span className="text-foreground-muted text-xs">{t('| קביעת פגישה', '| Book Meeting')}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggle} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer bg-transparent border-0">
              <Globe className="w-3.5 h-3.5" />
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <a href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
              {t('חזרה', 'Back')}<ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 flex-1">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('פגישת ייעוץ אסטרטגית', 'Strategic Consultation')}</h1>
          <p className="text-sm text-foreground-muted">
            {t(
              `45 דקות של בדיקת נאותות ממוקדת | עלות: ${MEETING_PRICE.toLocaleString('he-IL')} \u20AA`,
              `${MEETING_DURATION} minutes of focused due diligence | Cost: ${MEETING_PRICE.toLocaleString('he-IL')} \u20AA`
            )}
          </p>
        </div>

        {/* Cal.com Embedded Widget */}
        <div className="db-card p-6 mb-8">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-foreground mb-1">{t('קבע פגישה ישירות', 'Book Directly')}</h2>
            <p className="text-xs text-foreground-muted">{t('בחר מועד נוח מהיומן', 'Choose a convenient time from the calendar')}</p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#fff', minHeight: '400px' }}>
            <iframe
              src="https://cal.com/chaim-finn-xbxkhk?embed=true&theme=light"
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Schedule Consultation"
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-foreground-muted">{t('— או שלח פרטים ונחזור אליך —', '— or send your details and we\'ll contact you —')}</p>
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
                {weekdayNames.map((d) => <div key={d}>{d}</div>)}
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
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green" />{t('פנוי', 'Available')}</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" />{t('נבחר', 'Selected')}</div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-dim)]" />{t('לא זמין (שבת)', 'Unavailable (Sat)')}</div>
              </div>
            </div>

            {/* Time Slots + Info */}
            <div className="lg:col-span-2 space-y-4">
              {selectedDate ? (
                <div className="db-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {format(selectedDate, 'EEEE, d MMMM', { locale: he })}
                  </h3>
                  <p className="text-xs text-foreground-muted mb-4">{t('בחר שעה:', 'Choose a time:')}</p>
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
                        <span className="text-[10px] text-foreground-muted">{MEETING_DURATION}{t(' דק׳', ' min')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="db-card p-5 text-center">
                  <CalendarDays className="w-8 h-8 text-foreground-muted opacity-30 mx-auto mb-3" />
                  <p className="text-xs text-foreground-muted">{t('בחר תאריך מהיומן', 'Select a date from the calendar')}</p>
                </div>
              )}

              <div className="db-card p-5 space-y-3 text-xs text-foreground-muted">
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-green" />{t('משך: 45 דקות', 'Duration: 45 minutes')}</div>
                <div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-green" />{t('עלות: ', 'Cost: ')}{MEETING_PRICE.toLocaleString('he-IL')}{' \u20AA'}</div>
                <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-green" />{t('זמינות: כל יום מ-20:00', 'Availability: Daily from 20:00')}</div>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && selectedDate && (
          <div className="max-w-lg mx-auto db-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">{t('פרטי ההזמנה', 'Booking Details')}</h3>
            <p className="text-xs text-foreground-muted mb-6">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}{' | '}{selectedTime}{' | '}{MEETING_DURATION}{t(' דק׳', ' min')}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><User className="w-3 h-3" />{t('שם מלא *', 'Full Name *')}</label>
                <input className="input-field text-right text-sm" placeholder={t('ישראל ישראלי', 'John Doe')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Phone className="w-3 h-3" />{t('טלפון *', 'Phone *')}</label>
                <input className="input-field text-right text-sm" type="tel" placeholder="050-1234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><Mail className="w-3 h-3" />{t('אימייל *', 'Email *')}</label>
                <input className="input-field text-right text-sm" type="email" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{t('כתובת הפרויקט (אופציונלי)', 'Project Address (Optional)')}</label>
                <input className="input-field text-right text-sm" placeholder={t('עיר, רחוב', 'City, Street')} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
              </div>

              {sendError && (
                <div className="text-xs text-red-400 text-center py-2">{sendError}</div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('calendar')} className="btn-secondary py-3 px-4 rounded-lg text-sm flex-1">{t('חזרה ליומן', 'Back to Calendar')}</button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.name || !form.phone || !form.email || sending}
                  className="btn-primary py-3 px-4 rounded-lg text-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t('שולח...', 'Sending...')}</>
                  ) : (
                    <><CreditCard className="w-4 h-4" />{t('אישור הזמנה', 'Confirm Booking')}</>
                  )}
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
            <h3 className="text-xl font-bold text-foreground mb-2">{t('הפגישה נקבעה!', 'Meeting Booked!')}</h3>
            <p className="text-sm text-foreground-muted mb-4">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}{t(' בשעה ', ' at ')}{selectedTime}
            </p>

            <div className="db-card p-4 text-right text-xs text-foreground-muted space-y-1 mb-6">
              <div><span className="font-semibold text-foreground-secondary">{t('שם: ', 'Name: ')}</span>{form.name}</div>
              <div><span className="font-semibold text-foreground-secondary">{t('טלפון: ', 'Phone: ')}</span>{form.phone}</div>
              <div><span className="font-semibold text-foreground-secondary">{t('אימייל: ', 'Email: ')}</span>{form.email}</div>
              {form.project && <div><span className="font-semibold text-foreground-secondary">{t('פרויקט: ', 'Project: ')}</span>{form.project}</div>}
            </div>

            <p className="text-sm text-foreground-secondary mb-4">
              {t('הפרטים נשלחו אלינו בהצלחה. ניצור איתך קשר בהקדם לאישור סופי.', 'Your details have been sent successfully. We will contact you shortly for final confirmation.')}
            </p>

            <a href="/" className="btn-primary py-3 px-6 rounded-lg text-sm inline-flex items-center gap-2">
              {t('חזרה לדף הבית', 'Back to Home')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-[var(--border)] p-3 text-center text-[10px] text-foreground-muted mt-auto" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span>THE REALITY CHECK</span>
        <span className="opacity-30 mx-2">|</span>
        <span>{t('אנחנו בודקים. אתם ישנים בשקט.', 'We check. You sleep soundly.')}</span>
      </div>
    </div>
  );
}
