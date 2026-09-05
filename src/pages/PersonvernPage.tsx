import { Link } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { ScreenHeader } from '../components/layout/ScreenHeader';

export function PersonvernPage() {
  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title="Personvern" />
      <div className="space-y-3 p-4 text-sm leading-relaxed">
        <p>
          Roy Games er laget for å holde styr på poengene i familiens Bondebridge-turneringer, og for å ta vare på
          historikken år for år.
        </p>
        <p>
          Vi lagrer: navnene til spillerne som er med i hver turnering, og resultatene fra hver runde som spilles
          (meldinger, stikk og poeng). Ingenting annet — ingen sporing, ingen analyseverktøy, ingen annen bruk av
          dataene.
        </p>
        <p>
          Alle som har turneringskoden kan se resultatene live. Koden er derfor det eneste som beskytter dataene —
          del den bare med de som skal være med i turneringen.
        </p>
        <p>
          Du kan når som helst be om å få en spiller slettet fra navnebanken, eller en hel turnering slettet
          permanent. Ta kontakt med den som administrerer appen for familien.
        </p>
        <p>Appen er laget for privat, familiær bruk — ikke for kommersielt formål eller offentlig bruk.</p>
        <p>
          <Link to="/admin" className="text-xs text-ink/40 underline">
            Administrator
          </Link>
        </p>
      </div>
    </div>
  );
}
