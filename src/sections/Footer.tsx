import FooterComp from '@/components/FooterComp';
import { getContact } from '@/lib/queries';

export default async function Footer() {
  const contacts = await getContact();
  return <FooterComp {...contacts} />;
}
