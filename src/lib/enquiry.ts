import type { Service } from "@/content/site";
import type { EnquiryFieldKey, SiteData } from "@/content/types";
import { fillTemplate } from "./text";

export type EnquiryAnswers = {
  needs: string[];
  budget: string;
  timeline: string;
  name: string;
  company: string;
  message: string;
};

export const emptyEnquiryAnswers = (): EnquiryAnswers => ({ needs: [], budget: "", timeline: "", name: "", company: "", message: "" });

/** The exact WhatsApp (or e-mail) text a visitor would send, from the admin's own template. */
export function buildEnquiryMessage(site: SiteData, service: Pick<Service, "title">, answers: EnquiryAnswers, ref: string): string {
  return fillTemplate(site.enquiry.template, {
    name: answers.name,
    company: answers.company,
    service: service.title,
    needs: answers.needs.join(", "),
    budget: answers.budget,
    timeline: answers.timeline,
    message: answers.message,
    ref: site.enquiry.refCode ? ref : "",
  });
}

/** A card's own WhatsApp number if it has one, else the company's. */
export const enquiryWhatsappNumber = (site: SiteData, service: Pick<Service, "whatsappNumber">): string => service.whatsappNumber || site.contact.whatsappNumber;

function fieldFilled(key: EnquiryFieldKey, answers: EnquiryAnswers): boolean {
  if (key === "needs") return answers.needs.length > 0;
  if (key === "budget") return answers.budget.trim() !== "";
  if (key === "timeline") return answers.timeline.trim() !== "";
  if (key === "company") return answers.company.trim() !== "";
  return answers.message.trim() !== "";
}

/** A choice field with nothing to choose from isn't shown, so it can't be required either. */
function hasChoices(site: SiteData, key: EnquiryFieldKey, needs: string[] | undefined): boolean {
  if (key === "needs") return needs === undefined || needs.length > 0;
  if (key === "budget") return site.enquiry.budgets.length > 0;
  if (key === "timeline") return site.enquiry.timelines.length > 0;
  return true;
}

/** Name is always required; everything else follows `site.enquiry.required`. `needs`: the chosen service's options. */
export function enquiryMissingFields(site: SiteData, answers: EnquiryAnswers, needs?: string[]): EnquiryFieldKey[] {
  return site.enquiry.required.filter((f) => site.enquiry.fields.includes(f) && hasChoices(site, f, needs) && !fieldFilled(f, answers));
}

export const enquiryNameOk = (answers: EnquiryAnswers) => answers.name.trim().length >= 2;
