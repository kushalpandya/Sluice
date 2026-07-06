import { useTriage } from './hooks/useTriage.js';
import { DEMO_MODE } from './config.js';
import { Connect } from './components/Connect.jsx';
import { DemoBanner } from './components/DemoBanner.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { ReportsTable } from './components/ReportsTable.jsx';
import { ReportDetail } from './components/ReportDetail.jsx';
import { PromoteModal } from './components/PromoteModal.jsx';
import { PruneModal } from './components/PruneModal.jsx';
import { AttachmentViewer } from './components/AttachmentViewer.jsx';
import { Toast } from './components/Toast.jsx';
import { ThemeSwitch } from './components/ThemeSwitch.jsx';

export function App() {
  const t = useTriage();
  const themeSwitch = <ThemeSwitch mode={t.themeMode} setMode={t.setThemeMode} />;

  if (!t.authed) {
    return (
      <>
        {themeSwitch}
        <Connect
          base={t.sBase}
          setBase={t.setSBase}
          adminKey={t.sKey}
          setKey={t.setSKey}
          connect={t.connect}
        />
        <Toast msg={t.toastMsg} />
      </>
    );
  }

  return (
    <div>
      {themeSwitch}
      {DEMO_MODE && <DemoBanner />}
      <Toolbar
        filter={t.filter}
        changeFilter={t.changeFilter}
        busy={t.busy}
        onRefresh={() => t.load()}
        onPrune={() => t.setPrune({ window: null, count: null })}
        onSignOut={() => t.signOut()}
      />

      <ReportsTable
        rows={t.sortedReports}
        sort={t.sort}
        toggleSort={t.toggleSort}
        openDetail={t.openDetail}
        count={t.reports.length}
      />

      <ReportDetail
        detail={t.detail}
        onClose={t.closeDetail}
        onOpenAttachment={t.openAttachment}
        onDownloadAttachment={t.downloadAttachment}
        onDelete={t.del}
        onStatus={t.changeStatus}
        onPromote={t.openPromote}
      />

      <PromoteModal
        form={t.promoteForm}
        setForm={t.setPromoteForm}
        onCreate={t.createIssue}
        onClose={() => t.setPromoteForm(null)}
      />

      <PruneModal
        prune={t.prune}
        onClose={() => t.setPrune(null)}
        selectWindow={t.selectWindow}
        doPrune={t.doPrune}
      />

      <AttachmentViewer
        viewer={t.viewer}
        onClose={t.closeViewer}
        onDownload={t.downloadAttachment}
      />

      <Toast msg={t.toastMsg} />
    </div>
  );
}
