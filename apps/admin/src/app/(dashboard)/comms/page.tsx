import { redirect } from 'next/navigation';

// /comms is a hub; default to the event-driven (Automated) tab. The layout
// renders the tab nav so users can jump to Broadcasts from there.
export default function CommsRoot() {
  redirect('/comms/automated');
}
