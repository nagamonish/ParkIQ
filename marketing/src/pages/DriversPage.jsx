import { PageHeader } from "../components/PageHeader.jsx";
import { ForDrivers } from "../components/ForDrivers.jsx";
import { EarlyAccess } from "../components/EarlyAccess.jsx";
import { SIGHTLINE_URL } from "../config.js";

export default function DriversPage() {
  return (
    <>
      <PageHeader
        kicker="For drivers"
        title="Find a spot before you turn the key."
        lead="Open the Sightline finder and see live availability across every nearby lot, garage, and street — sorted by what's actually open."
      >
        <a className="btn btn-primary btn-lg" href={SIGHTLINE_URL} target="_blank" rel="noreferrer">
          Find parking near you
        </a>
      </PageHeader>
      <ForDrivers />
      <EarlyAccess />
    </>
  );
}
