import { redirect } from "next/navigation";

// /ebooks/ has no page of its own: the books live on the homepage
export default function EbooksIndex() {
  redirect("/#ebooks");
}
