import { useState, useRef, useEffect } from 'react'

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAY_NAMES = ['Lu','Ma','Me','Je','Ve','Sa','Di']

function toDateStr(d) {
  if (!d) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  // Monday-first (0=Mon … 6=Sun)
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function isBetween(date, start, end) {
  if (!start || !end) return false
  const s = start < end ? start : end
  const e = start < end ? end : start
  return date > s && date < e
}

function isStart(date, start, end) {
  if (!start) return false
  const s = end && end < start ? end : start
  return toDateStr(date) === toDateStr(s)
}

function isEnd(date, start, end) {
  if (!start || !end) return false
  const e = end < start ? start : end
  return toDateStr(date) === toDateStr(e)
}

function CalendarMonth({ year, month, startDate, endDate, hoverDate, onDayClick, onDayHover }) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const effectiveEnd = endDate || hoverDate

  return (
    <div className="w-full">
      <p className="text-center text-sm font-semibold text-navy mb-3">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />

          const dateStr = toDateStr(date)
          const isS = isStart(date, startDate, effectiveEnd)
          const isE = isEnd(date, startDate, effectiveEnd)
          const inRange = isBetween(date, startDate, effectiveEnd)
          const isToday = dateStr === toDateStr(new Date())

          let bg = ''
          let text = 'text-navy hover:bg-gold/10'
          let rounded = 'rounded-full'

          if (isS || isE) {
            bg = 'bg-gold'
            text = 'text-white font-semibold'
            rounded = isS && isE ? 'rounded-full' : isS ? 'rounded-l-full rounded-r-none' : 'rounded-r-full rounded-l-none'
          } else if (inRange) {
            bg = 'bg-gold/15'
            text = 'text-navy'
            rounded = 'rounded-none'
          }

          return (
            <div
              key={dateStr}
              className={`${bg} ${rounded} cursor-pointer transition-colors`}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
            >
              <div className={`w-8 h-8 mx-auto flex items-center justify-center text-xs ${text} ${isToday && !isS && !isE ? 'font-bold underline' : ''} rounded-full`}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PRESETS = [
  {
    label: "Aujourd'hui",
    get() {
      const d = toDateStr(new Date())
      return { from: d, to: d }
    }
  },
  {
    label: 'Cette semaine',
    get() {
      const now = new Date()
      const day = (now.getDay() + 6) % 7 // Mon=0
      const mon = new Date(now); mon.setDate(now.getDate() - day)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { from: toDateStr(mon), to: toDateStr(sun) }
    }
  },
  {
    label: 'Ce mois',
    get() {
      const now = new Date()
      return {
        from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        to: toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      }
    }
  },
  {
    label: 'Cette année',
    get() {
      const y = new Date().getFullYear()
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    }
  },
  {
    label: '12 derniers mois',
    get() {
      const now = new Date()
      const from = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: toDateStr(from), to: toDateStr(to) }
    }
  },
]

function formatRange(from, to) {
  if (!from && !to) return '12 derniers mois'
  const fmt = str => {
    if (!str) return ''
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }
  if (from === to) return fmt(from)
  return `${fmt(from)} — ${fmt(to)}`
}

export default function DateRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState(null) // first click date
  const [hoverDate, setHoverDate] = useState(null)
  const [viewYear, setViewYear] = useState(() => {
    const now = new Date()
    return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return now.getMonth() === 0 ? 11 : now.getMonth() - 1
  })
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const month2 = viewMonth === 11 ? 0 : viewMonth + 1
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(date) {
    if (!selecting) {
      setSelecting(date)
    } else {
      const s = selecting < date ? selecting : date
      const e = selecting < date ? date : selecting
      onChange({ from: toDateStr(s), to: toDateStr(e) })
      setSelecting(null)
      setHoverDate(null)
      setOpen(false)
    }
  }

  function handlePreset(preset) {
    onChange(preset.get())
    setSelecting(null)
    setHoverDate(null)
    setOpen(false)
  }

  const startDate = selecting || parseDate(from)
  const endDate = selecting ? null : parseDate(to)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy hover:border-gold/50 hover:shadow-sm transition-all"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">{formatRange(from, to)}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex gap-6 min-w-[580px]">
          {/* Left: presets */}
          <div className="flex flex-col gap-1 w-36 shrink-0 border-r border-gray-100 pr-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Raccourcis</p>
            {PRESETS.map(p => {
              const r = p.get()
              const active = from === r.from && to === r.to
              return (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${active ? 'bg-gold/10 text-gold font-semibold' : 'text-navy hover:bg-gray-50'}`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Right: calendars */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4 px-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6" onMouseLeave={() => setHoverDate(null)}>
              <CalendarMonth
                year={viewYear} month={viewMonth}
                startDate={startDate} endDate={endDate}
                hoverDate={selecting ? hoverDate : null}
                onDayClick={handleDayClick}
                onDayHover={d => selecting && setHoverDate(d)}
              />
              <CalendarMonth
                year={year2} month={month2}
                startDate={startDate} endDate={endDate}
                hoverDate={selecting ? hoverDate : null}
                onDayClick={handleDayClick}
                onDayHover={d => selecting && setHoverDate(d)}
              />
            </div>

            {selecting && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Cliquez sur la date de fin pour confirmer la sélection
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
