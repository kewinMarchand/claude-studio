'use client'

import { useEffect, useRef, useState } from 'react'

import {
  commandName,
  Composer,
  ComposerTools,
  ContextMeter,
  contextWindowFor,
  MessageList,
  useChat,
  type ComposerHandle,
} from '@/features/chat'
import { CapabilitiesDrawer, useCapabilities } from '@/features/capabilities'
import {
  FileViewer,
  SessionInfo,
  Sidebar,
  TopLimits,
  UsagePanel,
  useSessions,
  useUsage,
  useUsageLimits,
  type ViewableFile,
} from '@/features/sessions'
import { MODELS, SettingsDrawer, useSettings } from '@/features/settings'

export const StudioApp = () => {
  const { settings, ready, update, reset: resetSettings } = useSettings()
  const chat = useChat()
  const sessionsState = useSessions()
  const usageState = useUsage()
  const limitsState = useUsageLimits()
  const capabilities = useCapabilities(settings.cwd)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [capsOpen, setCapsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openFile, setOpenFile] = useState<ViewableFile | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const modelLabel = MODELS.find((m) => m.value === settings.model)?.label ?? settings.model
  const activeSummary = sessionsState.sessions.find((s) => s.id === chat.sessionId)
  const prevStatus = useRef(chat.status)
  const composerRef = useRef<ComposerHandle>(null)

  const refreshSessions = sessionsState.refresh
  const refreshUsage = usageState.refresh
  const refreshLimits = limitsState.refresh

  // Rafraîchit historique + usage + limites à la fin de chaque tour.
  useEffect(() => {
    if (prevStatus.current === 'streaming' && chat.status !== 'streaming') {
      refreshSessions()
      refreshUsage()
      refreshLimits()
    }
    prevStatus.current = chat.status
  }, [chat.status, refreshSessions, refreshUsage, refreshLimits])

  const activeCwd = chat.cwd ?? settings.cwd
  const slashCommands = [...capabilities.data.commands, ...capabilities.data.skills].map((i) => i.name)

  // Reflète la session courante dans l'URL (marque-pageable).
  // On n'écrit QUE lorsqu'une session existe : sinon le montage effacerait
  // le `?session=` avant que la restauration ait pu le lire. Le nettoyage de
  // l'URL est fait explicitement par les actions de reset (cf. clearSessionUrl).
  useEffect(() => {
    if (chat.sessionId) window.history.replaceState(null, '', `?session=${chat.sessionId}`)
  }, [chat.sessionId])

  // Au montage, reprend la session indiquée par l'URL.
  const loadSession = chat.loadSession
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session')
    if (id) void loadSession(id)
  }, [loadSession])

  // Onglet : signale visuellement que le modèle travaille / a terminé.
  useEffect(() => {
    document.title = chat.status === 'streaming' ? '● Claude travaille… · Claude Studio' : 'Claude Studio'
  }, [chat.status])

  const clearSessionUrl = () => window.history.replaceState(null, '', window.location.pathname)

  const handleHome = () => {
    chat.reset()
    clearSessionUrl()
    setSidebarOpen(false)
  }

  const handleNewConversation = () => {
    chat.reset()
    clearSessionUrl()
    setSidebarOpen(false)
  }

  const handleSend = (prompt: string) => {
    if (commandName(prompt) === 'clear') {
      handleNewConversation()
      return
    }
    void chat.send(prompt, {
      model: settings.model,
      permissionMode: settings.permissionMode,
      effort: settings.effort,
      cwd: settings.cwd,
      appendSystemPrompt: settings.appendSystemPrompt,
    })
  }

  const handleSelectSession = (id: string) => {
    void chat.loadSession(id)
    setSidebarOpen(false)
  }

  const handleDeleteSession = (id: string) => {
    if (!window.confirm('Supprimer cette conversation ? Cette action est définitive.')) return
    void fetch(`/api/sessions/${id}`, { method: 'DELETE' }).then(() => {
      if (chat.sessionId === id) {
        chat.reset()
        clearSessionUrl()
      }
      refreshSessions()
    })
  }

  const handleChangeCwd = (path: string) => {
    update('cwd', path)
    chat.reset()
    clearSessionUrl()
  }

  const retryLast = () => {
    const lastUser = [...chat.messages].reverse().find((m) => m.role === 'user')
    if (lastUser) handleSend(lastUser.text)
  }

  return (
    <div className="studio" data-ready={ready}>
      <div className="studio__col">
        <header className="topbar">
          <button type="button" className="topbar__brand" onClick={handleHome} title="Retour à l’accueil">
            <span className="topbar__logo" aria-hidden="true">
              ✳
            </span>
            <span className="topbar__name">Claude Studio</span>
          </button>

          <TopLimits limits={limitsState.limits} loading={limitsState.loading} />

          <div className="topbar__meta">
            <span className="badge" title={`Modèle : ${modelLabel}`}>
              {settings.model}
            </span>
            <span className="badge badge--muted" title="Dossier de travail">
              {activeCwd ? activeCwd.split('/').pop() : 'défaut'}
            </span>
          </div>

          <div className="topbar__actions">
            <button
              type="button"
              className="iconbtn"
              onClick={() => setSidebarOpen(true)}
              aria-haspopup="dialog"
              title="Sessions, historique, dossier de travail"
            >
              Sessions
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => setCapsOpen(true)}
              aria-haspopup="dialog"
              title="Commandes, skills, agents, MCP"
            >
              Outils
            </button>
            <button
              type="button"
              className="iconbtn"
              onClick={() => setSettingsOpen(true)}
              aria-haspopup="dialog"
              title="Réglages"
            >
              Réglages
            </button>
          </div>
        </header>

        {chat.messages.length > 0 && (
          <ContextMeter
            contextTokens={chat.contextTokens}
            model={settings.model}
            sessionUsage={chat.sessionUsage}
            onInfo={() => setInfoOpen(true)}
          />
        )}

        <main className="studio__main">
          <MessageList
            messages={chat.messages}
            status={chat.status}
            error={chat.error}
            cwd={activeCwd}
            onRetry={retryLast}
            homeExtra={
              <UsagePanel
                weekly={usageState.weekly}
                loading={usageState.loading}
                limits={limitsState.limits}
                limitsLoading={limitsState.loading}
              />
            }
          />
        </main>

        <footer className="studio__footer">
          <div className="composer-wrap">
            <ComposerTools
              cwd={settings.cwd}
              onChangeCwd={handleChangeCwd}
              skills={capabilities.data.skills.map((i) => i.name)}
              agents={capabilities.data.agents.map((i) => i.name)}
              onInsert={(t) => composerRef.current?.insert(t)}
            />
            <Composer
              ref={composerRef}
              streaming={chat.status === 'streaming'}
              commands={slashCommands}
              onSend={handleSend}
              onStop={chat.stop}
            />
          </div>
        </footer>
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        cwd={settings.cwd}
        onChangeCwd={handleChangeCwd}
        onNewConversation={handleNewConversation}
        sessions={sessionsState.sessions}
        sessionsLoading={sessionsState.loading}
        activeSessionId={chat.sessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onOpenFile={setOpenFile}
      />

      <FileViewer file={openFile} onClose={() => setOpenFile(null)} />

      <SessionInfo
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        sessionId={chat.sessionId}
        modelLabel={modelLabel}
        contextTokens={chat.contextTokens}
        contextWindow={contextWindowFor(settings.model)}
        summary={activeSummary}
      />

      <CapabilitiesDrawer
        open={capsOpen}
        onClose={() => setCapsOpen(false)}
        data={capabilities.data}
        loading={capabilities.loading}
        onUse={(text) => composerRef.current?.insert(text)}
        onView={setOpenFile}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        update={update}
        reset={resetSettings}
      />
    </div>
  )
}
