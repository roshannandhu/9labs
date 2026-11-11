/** "Download as spreadsheet" links above the enquiries and quiz-results lists. */
function Export({ what }: { what: string }) {
  return (
    <div className="nl-tools">
      <a className="nl-tools__link" href={`/api/nl/export/${what}`}>
        Download as spreadsheet (CSV)
      </a>
    </div>
  );
}
export const EnquiryExport = () => <Export what="enquiries" />;
export const QuizExport = () => <Export what="quiz" />;
