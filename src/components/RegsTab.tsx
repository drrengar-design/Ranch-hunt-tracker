import { useMemo, useState } from 'react';
import {
  LICENSE_YEARS,
  TPWD_DUVAL_URL,
  TPWD_OUTDOOR_ANNUAL_URL,
  defaultLicenseYear,
  formatRanges,
  isPeriodOpen,
  isSpeciesOpen,
  localISODate,
  openSpecies,
  yearById,
  type LicenseYearId,
} from '../tpwdRegs';

export function RegsTab({ now = new Date() }: { now?: Date }) {
  const today = localISODate(now);
  const [yearId, setYearId] = useState<LicenseYearId>(() => defaultLicenseYear(today));
  const year = yearById(yearId);
  const currentId = defaultLicenseYear(today);
  const openNow = useMemo(() => openSpecies(year, today), [year, today]);

  return (
    <div className="page regs-page">
      <h2>Regs</h2>
      <p className="sub">
        Read-only TPWD calendar for the ranch. Ranch-managed seasons (check-in and
        harvest) stay on the Seasons tab.
      </p>

      <article className="card regs-hero">
        <h3>Duval County · near Ramirez, South Texas</h3>
        <p className="meta">
          South Zone dates from the Texas Parks &amp; Wildlife Outdoor Annual.
          Regulations change every license year — confirm tags, legal means, and
          county notes on TPWD before hunting. Feral hog is not listed on the
          Duval county page.
        </p>
        <p className="regs-links">
          <a href={TPWD_DUVAL_URL} target="_blank" rel="noopener noreferrer">
            TPWD Duval County
          </a>
          <span aria-hidden="true"> · </span>
          <a
            href={TPWD_OUTDOOR_ANNUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Outdoor Annual
          </a>
        </p>
      </article>

      <div className="chips regs-years" role="tablist" aria-label="License year">
        {LICENSE_YEARS.map((y) => (
          <button
            key={y.id}
            type="button"
            role="tab"
            aria-selected={yearId === y.id}
            className={`chip${yearId === y.id ? ' active' : ''}`}
            onClick={() => setYearId(y.id)}
          >
            {y.label}
            {y.id === currentId ? ' · now' : ''}
          </button>
        ))}
      </div>
      <p className="meta regs-year-note">{year.sourceNote}</p>
      <p className="regs-links regs-year-links">
        {year.sourceUrls.map((link, i) => (
          <span key={link.href}>
            {i > 0 ? <span aria-hidden="true"> · </span> : null}
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </span>
        ))}
      </p>

      {openNow.length > 0 && (
        <article className="card regs-open-summary">
          <div className="row spread">
            <h3>Open now</h3>
            <span className="status open">Today {today}</span>
          </div>
          <p className="meta" style={{ margin: '6px 0 0' }}>
            {openNow.map((s) => s.name).join(' · ')}
          </p>
        </article>
      )}

      {openNow.length === 0 && (
        <p className="meta regs-closed-note">
          No listed {year.label} seasons are open on {today}.
        </p>
      )}

      <div className="list">
        {year.species.map((species) => {
          const speciesOpen = isSpeciesOpen(species, today);
          return (
            <article
              className={`card${speciesOpen ? ' regs-open-card' : ''}`}
              key={species.id}
            >
              <div className="row spread">
                <h3>{species.name}</h3>
                {speciesOpen ? (
                  <span className="status open">Open now</span>
                ) : (
                  <span className="status closed">Closed</span>
                )}
              </div>
              <p className="meta">
                {[species.zone, species.bag ? `Bag: ${species.bag}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {species.notes?.map((note) => (
                <p className="meta regs-note" key={note}>
                  {note}
                </p>
              ))}
              <ul className="regs-periods">
                {species.periods.map((period) => {
                  const open = isPeriodOpen(period, today);
                  return (
                    <li key={period.id} className={open ? 'open' : undefined}>
                      <div className="regs-period-label">
                        {period.label}
                        {open ? (
                          <span className="status open">Now</span>
                        ) : null}
                      </div>
                      <div className="regs-period-dates">
                        {formatRanges(period.ranges)}
                        {period.note ? (
                          <span className="meta"> — {period.note}</span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
