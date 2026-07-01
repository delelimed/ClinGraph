import { colors } from "../styles";

export default function Footer() {
  return (
    <footer style={{
      width: '100%',
      borderTop: `1px solid ${colors.border}`,
      background: colors.bgSurface,
      padding: '20px 24px',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Disclaimer */}
        <div style={{
          background: colors.bgDeep,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '12px 16px',
          width: '100%',
        }}>
          <p style={{
            margin: 0,
            fontSize: 11,
            color: colors.textMuted,
            lineHeight: 1.6,
          }}>
            <strong style={{ color: colors.textSecondary }}>Disclaimer:</strong> ClinGraph e' uno strumento sperimentale a carattere puramente informativo e educativo, sviluppato e aggiornato da <strong style={{ color: colors.accent }}>DELELIMED</strong>. Le informazioni contenute non costituiscono indicazioni cliniche né sostituiscono il parere di un medico. Per qualsiasi problematica di salute, consultare sempre un professionista sanitario qualificato.
          </p>
        </div>

        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: colors.textMuted,
        }}>
          <span style={{ fontWeight: 600, color: colors.textSecondary }}>ClinGraph</span>
          <span>|</span>
          <span>CDSS by <strong style={{ color: colors.accent }}>DELELIMED</strong></span>
        </div>

        <p style={{
          margin: 0,
          fontSize: 10,
          color: colors.textMuted,
          opacity: 0.6,
        }}>
          Clinical Decision Support System — Edizione sperimentale
        </p>
      </div>
    </footer>
  );
}
