/**
 * CandidateCard: a selectable card showing the candidate's photo,
 * name, and party. Highlights when selected.
 */

import './CandidateCard.css'

export default function CandidateCard({ candidate, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`candidate-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(candidate.id)}
      aria-pressed={selected}
      aria-label={`Seleccionar a ${candidate.name} de ${candidate.party}`}
    >
      {/* Selection indicator */}
      <div className="candidate-check">
        {selected ? '✓' : ''}
      </div>

      {/* Candidate photo */}
      <div className="candidate-photo-wrap">
        <img
          src={candidate.photo}
          alt={candidate.name}
          className="candidate-photo"
          loading="lazy"
          onError={e => {
            // Fallback if image fails to load
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        <div className="candidate-photo-fallback" style={{ display: 'none' }}>
          {candidate.name.charAt(0)}
        </div>
      </div>

      {/* Info */}
      <div className="candidate-info">
        <p className="candidate-name">{candidate.name}</p>

        <div className="candidate-party">
          <img
            src={candidate.party_logo}
            alt={candidate.party}
            className="party-logo"
            loading="lazy"
            onError={e => { e.target.style.display = 'none' }}
          />
          <span className="party-name">{candidate.party}</span>
        </div>
      </div>
    </button>
  )
}
