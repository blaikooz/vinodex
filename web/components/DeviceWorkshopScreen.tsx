import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Check, CornerDownRight, Hammer, Lock, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import DexAlert from './DexAlert';
import ChassisGrille from './ChassisGrille';
import {
  CHASSIS_SKINS,
  ChassisSkinId,
  LCD_MODES,
  LcdModeId,
  SKIN_LIGHTS,
  applyBuild,
  footerCap,
  readBuild,
  setPart,
  subscribeToTheme,
  themeRevision,
} from '../src/services/theme';
import {
  DEVICE_AXES,
  DeviceAxisId,
  DeviceBuild,
  GRILLE_SHAPE_IDS,
  PART_COLOR_BASE,
  PART_COLOR_IDS,
  STOCK_BUILD,
  buildsEqual,
  chosenCount,
  grilleShapeOf,
  isStock,
  partAccent,
  partColorName,
  partColorOf,
  partMarqueeText,
  partOrbGlow,
  readsAsInk,
} from '../src/services/deviceParts';
import {
  CustomDevice,
  DEVICE_CAPACITY,
  DEVICE_NAME_LIMIT,
  deleteDevice,
  devicesRevision,
  matchingDevice,
  normalizeDeviceName,
  saveDevice,
  savedDevices,
  subscribeToDevices,
} from '../src/services/customDevices';
import { isGranted, starterOnly } from '../src/services/access';
import { useAccess } from '../src/services/useAccess';

interface DeviceWorkshopScreenProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * The Device Workshop (v0.5.0) — the last v6 parity item, v6#35, under the
 * §0 rule: iOS's idea and data model (`DeviceWorkshopScreen.swift`, 849
 * lines; `CustomDevices.swift`; `DeviceParts.swift`), the web's own
 * presentation on the stage-4 token language.
 *
 * **The live preview is the device you are holding** — iOS's founding
 * observation transfers whole: this screen runs inside the LCD of the thing
 * being customised, the rows write the same storage keys the chassis reads
 * through `applyTheme`, and fitting a violet orb turns the real orb violet
 * while your finger is still on the chip. The schematic at the top is a
 * labelled diagram, not the preview — it exists for the three parts you
 * cannot see while you are looking through them (the screen ground, the
 * font ink) or cannot judge at two pixels (the grille pattern), and it is
 * drawn from the same resolved custom properties the chassis paints with.
 *
 * **Editing live means editing the live thing**, so REVERT restores the
 * build as it was when the screen opened — cheaper than a draft, which
 * would be a second answer to "what does the device look like right now".
 *
 * Two web-side simplifications, recorded: iOS gates the shell and screen
 * rows behind their own bundles inside the workshop — the web's free tier is
 * un-gated, so every chip is live and the whole door rides the GARAGISTE
 * cheat only under the ACCESS test harness. And iOS's grille MESH is a
 * Canvas stroke; the web's is a repeating-gradient, same weave.
 */
const DeviceWorkshopScreen: React.FC<DeviceWorkshopScreenProps> = ({ onBack, onHome }) => {
  // Repaint on any theme or part write, and on any saved-build change.
  useSyncExternalStore(subscribeToTheme, themeRevision, themeRevision);
  useSyncExternalStore(subscribeToDevices, devicesRevision, devicesRevision);
  useAccess();

  const build = readBuild();
  const lcd = LCD_MODES[(build.screen as LcdModeId) in LCD_MODES ? (build.screen as LcdModeId) : 'DARK'];
  const shellId: ChassisSkinId = (build.shell as ChassisSkinId) in CHASSIS_SKINS ? (build.shell as ChassisSkinId) : 'CLASSIC';

  /** What the device looked like when this screen opened — REVERT's target. */
  const [openedWith, setOpenedWith] = useState<DeviceBuild | null>(null);
  useEffect(() => {
    setOpenedWith(prev => prev ?? readBuild());
  }, []);

  const [typedName, setTypedName] = useState('');
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<CustomDevice | null>(null);

  const fitted = matchingDevice(build);
  const reverted = openedWith !== null && buildsEqual(openedWith, build);

  // The one gate: under the ACCESS test harness the workshop is a locked
  // door, and GARAGISTE is its key — the cheat-table rule ("every code does
  // something today") is what put the code and the door in the same release.
  const locked = starterOnly() && !isGranted({ kind: 'workshop' });

  const submitSave = () => {
    const outcome = saveDevice(typedName, build);
    switch (outcome.kind) {
      case 'saved':
        setNotice({ text: `SAVED AS ${normalizeDeviceName(typedName)}.`, bad: false });
        setTypedName('');
        break;
      case 'replaced':
        setNotice({ text: `${normalizeDeviceName(typedName)} UPDATED.`, bad: false });
        setTypedName('');
        break;
      case 'needsName':
        setNotice({ text: 'GIVE THE BUILD A NAME FIRST.', bad: true });
        break;
      case 'full':
        setNotice({ text: `${DEVICE_CAPACITY} BUILDS ALREADY SAVED. DELETE ONE.`, bad: true });
        break;
      case 'nameTaken':
        setNotice({ text: 'ANOTHER BUILD ALREADY HAS THAT NAME.', bad: true });
        break;
    }
  };

  /** What an unset axis actually paints — the honest FOLLOW swatch. */
  const inheritedSwatch = (axis: DeviceAxisId): string => {
    switch (axis) {
      case 'buttons': return footerCap(shellId, 'home').top;
      case 'orb': return SKIN_LIGHTS[shellId].orbGlow;
      case 'headerLamps':
      case 'marqueeLamps': return SKIN_LIGHTS[shellId].lamps[1][0];
      case 'marquee': return 'var(--marquee-text)';
      case 'grilleColor': return CHASSIS_SKINS[shellId].grill;
      case 'font': return lcd.text;
      default: return CHASSIS_SKINS[shellId].body;
    }
  };

  /** The saved build's five identifying dots — enough to tell two apart. */
  const buildSwatches = (b: DeviceBuild): string[] => {
    const skin: ChassisSkinId = (b.shell as ChassisSkinId) in CHASSIS_SKINS ? (b.shell as ChassisSkinId) : 'CLASSIC';
    const buttons = partColorOf(b.buttons);
    const orb = partColorOf(b.orb);
    const marquee = partColorOf(b.marquee);
    const grille = partColorOf(b.grilleColor);
    return [
      CHASSIS_SKINS[skin].body,
      buttons ? partAccent(buttons).bright : footerCap(skin, 'home').top,
      orb ? partOrbGlow(orb) : SKIN_LIGHTS[skin].orbGlow,
      marquee ? partMarqueeText(marquee) : '#22c55e',
      grille ? PART_COLOR_BASE[grille] : CHASSIS_SKINS[skin].grill,
    ];
  };

  const sectionHeader = (title: string) => (
    <h2 className="text-label uppercase tracking-widest text-[var(--lcd-accent)] border-b-2 pb-1 mb-3" style={{ borderColor: 'var(--lcd-accent)' }}>
      {title}
    </h2>
  );

  /** One part chip: swatch, label, chosen ring. */
  const chip = (
    key: string,
    label: string,
    isChosen: boolean,
    swatch: React.ReactNode,
    onPick: () => void,
  ) => (
    <button
      key={key}
      onClick={onPick}
      aria-pressed={isChosen}
      className={`dex-pressable flex flex-col items-center gap-1.5 p-2 rounded-control border ${
        isChosen
          ? 'border-[var(--lcd-accent)] bg-[var(--surface-high)]'
          : 'border-[var(--surface-line)] bg-[var(--surface-raised)]'
      }`}
    >
      <span className="relative w-7 h-7 rounded-full overflow-hidden flex items-center justify-center border border-[var(--surface-line-strong)]">
        {swatch}
        {isChosen && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Check size={14} className="text-white" />
          </span>
        )}
      </span>
      <span className="text-caption leading-tight text-center text-[var(--lcd-text)] break-words w-full">
        {label}
      </span>
    </button>
  );

  const dot = (color: string) => <span className="absolute inset-0" style={{ backgroundColor: color }} />;

  const colorChooser = (axis: DeviceAxisId) => {
    const chosen = build[axis];
    // FONT offers only the inks this screen will actually draw in; every
    // other axis is decoration and offers the whole palette. The rule itself
    // is enforced in `applyTheme`, so an ink chosen on a dark screen simply
    // stops applying when the screen turns pale.
    const options = axis === 'font'
      ? PART_COLOR_IDS.filter(id => lcd.monochromeTint === null && readsAsInk(id, lcd.isLight))
      : PART_COLOR_IDS;

    const fontNote = axis !== 'font' ? null
      : lcd.monochromeTint !== null
        ? `${lcd.displayName} tints the whole display to one phosphor, so it sets the ink itself. Pick another screen to choose a font colour.`
        : (() => {
            const part = partColorOf(build.font);
            return part && !readsAsInk(part, lcd.isLight)
              ? `${partColorName(part)} does not read on ${lcd.displayName} — the screen's own ink is in use. It comes back on a screen it suits.`
              : null;
          })();

    return (
      <>
        {fontNote && (
          <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed mb-2 p-3 rounded-control bg-[var(--surface-raised)]">
            {fontNote}
          </p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {chip(
            'follow',
            'FOLLOW',
            chosen === '',
            <>
              {dot(inheritedSwatch(axis))}
              <CornerDownRight size={12} className="relative text-white drop-shadow" aria-hidden="true" />
            </>,
            () => setPart(axis, ''),
          )}
          {options.map(id =>
            chip(id, partColorName(id), chosen === id, dot(PART_COLOR_BASE[id]), () => setPart(axis, id)),
          )}
        </div>
      </>
    );
  };

  const chooserFor = (axis: DeviceAxisId): React.ReactNode => {
    switch (axis) {
      case 'shell':
        return (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CHASSIS_SKINS) as ChassisSkinId[]).map(id =>
              chip(
                id,
                CHASSIS_SKINS[id].displayName,
                shellId === id,
                dot(CHASSIS_SKINS[id].body),
                // CLASSIC is the default, stored as absence — the invariant
                // that keeps a stock device's storage clean.
                () => setPart('shell', id === 'CLASSIC' ? '' : id),
              ),
            )}
          </div>
        );
      case 'screen':
        return (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(LCD_MODES) as LcdModeId[]).map(id =>
              chip(
                id,
                LCD_MODES[id].displayName,
                lcd.id === id,
                dot(LCD_MODES[id].screen),
                () => setPart('screen', id === 'DARK' ? '' : id),
              ),
            )}
          </div>
        );
      case 'grilleShape':
        return (
          <div className="grid grid-cols-4 gap-2">
            {GRILLE_SHAPE_IDS.map(id =>
              chip(
                id,
                id,
                grilleShapeOf(build.grilleShape) === id,
                <span className="scale-[0.45] origin-center"><ChassisGrille shape={id} /></span>,
                () => setPart('grilleShape', id === 'SLATS' ? '' : id),
              ),
            )}
          </div>
        );
      default:
        return colorChooser(axis);
    }
  };

  if (locked) {
    return (
      <DeviceLayout title="WORKSHOP" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
          <Lock size={44} className="text-[var(--lcd-subtext)]" />
          <p className="text-label tracking-widest text-[var(--lcd-text)]">THE WORKSHOP IS LOCKED</p>
          <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed max-w-[18rem]">
            The free-tier harness is on and this door is a bundle. There is a
            code for it — codes are found, not listed.
          </p>
        </div>
      </DeviceLayout>
    );
  }

  return (
    <DeviceLayout title="WORKSHOP" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5" style={{ backgroundColor: 'var(--lcd-page)' }}>

        {/* The schematic: every part at once, drawn from the same resolved
            custom properties the chassis paints with, so it cannot drift. */}
        <div className="rounded-card border-2 p-3.5 bg-[var(--surface-raised)] shadow-elev-1" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 50%, transparent)' }}>
          <div className="flex items-start gap-4">
            {/* The mini-device. A diagram at a readable scale, not a chassis. */}
            <div className="w-28 shrink-0 rounded-lg p-2 flex flex-col gap-1.5" style={{ backgroundColor: 'var(--chassis-body)', border: '1px solid var(--chassis-panel-edge)' }} aria-hidden="true">
              <div className="flex items-center gap-1">
                <span className="h-2 flex-1 max-w-9 rounded-full" style={{ backgroundColor: 'var(--chassis-orb)', border: '1px solid var(--chassis-orb-glow)' }} />
                <span className="flex-1" />
                {[1, 2, 3].map(n => (
                  <span key={n} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `var(--chassis-lamp${n})` }} />
                ))}
              </div>
              <div className="rounded p-1.5 flex flex-col gap-1" style={{ backgroundColor: 'var(--lcd-screen)', filter: 'var(--lcd-grayscale, none)' }}>
                <span className="h-1 w-10 rounded-sm" style={{ backgroundColor: 'var(--lcd-text)' }} />
                <span className="h-1 w-12 rounded-sm" style={{ backgroundColor: 'var(--lcd-body-text)' }} />
                <span className="h-1 w-8 rounded-sm" style={{ backgroundColor: 'var(--lcd-subtext)' }} />
              </div>
              <div className="flex items-center justify-end">
                <span className="scale-[0.6] origin-right"><ChassisGrille shape={grilleShapeOf(build.grilleShape)} /></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border" style={{ background: 'linear-gradient(to bottom, var(--cap-back-top), var(--cap-back-bottom))', borderColor: 'var(--cap-back-edge)' }} />
                <span className="flex-1 flex flex-col gap-0.5">
                  <span className="flex gap-0.5">
                    <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: 'var(--pill-lamp1)' }} />
                    <span className="h-1 flex-1 rounded-full" style={{ backgroundColor: 'var(--pill-lamp3)' }} />
                  </span>
                  <span className="h-2.5 rounded-sm bg-black border" style={{ borderColor: 'var(--marquee-text)' }}>
                    <span className="block h-full w-2/3 mx-auto" style={{ backgroundColor: 'var(--marquee-text)', opacity: 0.6 }} />
                  </span>
                </span>
                <span className="w-3 h-3 rounded-full border" style={{ background: 'linear-gradient(to bottom, var(--cap-home-top), var(--cap-home-bottom))', borderColor: 'var(--cap-home-edge)' }} />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <span className="text-micro tracking-widest text-[var(--lcd-subtext)]">
                {chosenCount(build)} OF {DEVICE_AXES.length} PARTS FITTED
              </span>
              {fitted ? (
                <span className="flex items-center gap-1.5 text-label tracking-widest text-[var(--lcd-accent)]">
                  <ShieldCheck size={14} /> {fitted.name}
                </span>
              ) : isStock(build) ? (
                <span className="flex items-center gap-1.5 text-label tracking-widest text-[var(--lcd-subtext)]">
                  <PackageCheck size={14} /> FACTORY STOCK
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-label tracking-widest text-[var(--lcd-subtext)]">
                  <Hammer size={14} /> UNSAVED
                </span>
              )}
              <span className="flex-1" />
              {/* Drawn in the fixed red, on purpose (iOS's own call): this is
                  the way out of a font colour that turned out unreadable, and
                  a way out drawn in the ink you just broke is no way out. */}
              <button
                onClick={() => { applyBuild(openedWith ?? STOCK_BUILD); setNotice({ text: 'PARTS BACK AS YOU FOUND THEM.', bad: false }); }}
                disabled={reverted}
                className={`dex-pressable flex items-center justify-center gap-1.5 rounded-control border-2 border-red-500 px-3 py-2 text-micro tracking-widest text-red-500 ${reverted ? 'opacity-40 cursor-default' : ''}`}
              >
                <RotateCcw size={13} /> REVERT
              </button>
            </div>
          </div>
        </div>

        {/* SAVE + SAVED ride above the axis rows (iOS 0.8.8 H1): fitting a
            build you already made is one tap; making a new one is ten
            sections. */}
        <div>
          {sectionHeader('SAVE THIS BUILD')}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitSave(); }}
              maxLength={DEVICE_NAME_LIMIT}
              placeholder="NAME"
              aria-label="Build name"
              className="flex-1 min-w-0 rounded-control border border-[var(--surface-line-strong)] px-3 py-2.5 text-label text-[var(--lcd-text)] placeholder:text-[var(--lcd-disabled-text)] focus:border-[var(--lcd-accent)] focus:outline-none"
              style={{ backgroundColor: 'var(--lcd-well)' }}
            />
            <button
              onClick={submitSave}
              className="dex-pressable rounded-control bg-[var(--lcd-accent)] px-5 py-2.5 text-label tracking-widest text-[var(--lcd-on-accent)] shadow-elev-1"
            >
              SAVE
            </button>
          </div>
          {notice && (
            <p className={`text-caption normal-case mt-2 ${notice.bad ? 'text-[var(--livery-red)]' : 'text-[var(--lcd-accent)]'}`} role="status">
              {notice.text}
            </p>
          )}
          <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed mt-2">
            Saving under a name you have already used replaces that build — which is how you edit one.
          </p>
        </div>

        <div>
          {sectionHeader('SAVED BUILDS')}
          {savedDevices().length === 0 ? (
            <p className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed">
              Nothing saved yet. Fit some parts, name the result, and it lands here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {savedDevices().map(device => {
                const isFitted = buildsEqual(device.build, build);
                return (
                  <div
                    key={device.id}
                    className={`rounded-card p-3 bg-[var(--surface-raised)] border shadow-elev-1 ${isFitted ? 'border-[var(--lcd-accent)]' : 'border-[var(--surface-line)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-label tracking-widest truncate ${isFitted ? 'text-[var(--lcd-accent)]' : 'text-[var(--lcd-text)]'}`}>
                        {device.name}
                      </span>
                      {isFitted && (
                        <span className="text-micro tracking-widest px-1.5 py-0.5 rounded-sm bg-[var(--lcd-accent)] text-[var(--lcd-on-accent)]">
                          FITTED
                        </span>
                      )}
                      <span className="flex-1" />
                      <span className="flex gap-1" aria-hidden="true">
                        {buildSwatches(device.build).map((color, i) => (
                          <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={() => { applyBuild(device.build); setNotice({ text: `${device.name} FITTED.`, bad: false }); }}
                        disabled={isFitted}
                        className={`dex-pressable flex-1 rounded-control border border-[var(--lcd-accent)] py-2 text-micro tracking-widest text-[var(--lcd-accent)] ${isFitted ? 'opacity-40 cursor-default' : ''}`}
                      >
                        FIT
                      </button>
                      {/* EDIT loads the name rather than opening a modal: the
                          parts are already editable — they are the rows below
                          — and re-saving under the name replaces the build. */}
                      <button
                        onClick={() => setTypedName(device.name)}
                        className="dex-pressable flex-1 rounded-control border border-[var(--surface-line-strong)] py-2 text-micro tracking-widest text-[var(--lcd-subtext)]"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(device)}
                        className="dex-pressable flex-1 rounded-control border border-[var(--livery-red)] py-2 text-micro tracking-widest text-[var(--livery-red)]"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {DEVICE_AXES.map(axis => (
          <div key={axis.id}>
            {sectionHeader(axis.title)}
            {chooserFor(axis.id)}
          </div>
        ))}
      </div>

      {confirmingDelete && (
        <DexAlert
          tone="red"
          role="alertdialog"
          title={`DELETE ${confirmingDelete.name}?`}
          ariaLabel={`Delete ${confirmingDelete.name}`}
          onDismiss={() => setConfirmingDelete(null)}
          actions={[
            { label: 'CANCEL', kind: 'cancel', onClick: () => setConfirmingDelete(null) },
            { label: 'DELETE', kind: 'confirm', onClick: () => { deleteDevice(confirmingDelete.id); setConfirmingDelete(null); } },
          ]}
        >
          The saved build goes. The device keeps whatever parts are fitted right now.
        </DexAlert>
      )}
    </DeviceLayout>
  );
};

export default DeviceWorkshopScreen;
