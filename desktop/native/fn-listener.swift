import Cocoa
import Darwin

var fnIsDown = false
var tapPort: CFMachPort?

func emit(_ message: String) {
  FileHandle.standardOutput.write((message + "\n").data(using: .utf8)!)
  fflush(stdout)
}

func emitError(_ message: String) {
  FileHandle.standardError.write(("ERROR:\(message)\n").data(using: .utf8)!)
  fflush(stderr)
}

let eventMask =
  CGEventMask(1 << CGEventType.flagsChanged.rawValue) |
  CGEventMask(1 << CGEventType.keyDown.rawValue)

let callback: CGEventTapCallBack = { _, type, event, _ in
  if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
    if let tapPort { CGEvent.tapEnable(tap: tapPort, enable: true) }
    return Unmanaged.passUnretained(event)
  }

  if type == .keyDown {
    if fnIsDown { emit("FN_INTERRUPTED") }
    return Unmanaged.passUnretained(event)
  }

  let flags = event.flags
  let otherModifiers: CGEventFlags = [.maskCommand, .maskAlternate, .maskControl, .maskShift]
  if !flags.intersection(otherModifiers).isEmpty {
    return Unmanaged.passUnretained(event)
  }

  let isFnDownNow = flags.contains(.maskSecondaryFn)
  if isFnDownNow && !fnIsDown {
    fnIsDown = true
    emit("FN_DOWN")
    return nil
  }
  if !isFnDownNow && fnIsDown {
    fnIsDown = false
    emit("FN_UP")
    return nil
  }
  return Unmanaged.passUnretained(event)
}

guard let tap = CGEvent.tapCreate(
  tap: .cgSessionEventTap,
  place: .headInsertEventTap,
  options: .defaultTap,
  eventsOfInterest: eventMask,
  callback: callback,
  userInfo: nil
) else {
  emitError("tap_create_failed — grant Accessibility permission")
  exit(1)
}

tapPort = tap
guard let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0) else {
  emitError("runloop_source_failed")
  exit(1)
}

CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
CGEvent.tapEnable(tap: tap, enable: true)
emit("READY")

let signalSource = DispatchSource.makeSignalSource(signal: SIGTERM, queue: .main)
signal(SIGTERM, SIG_IGN)
signalSource.setEventHandler {
  CGEvent.tapEnable(tap: tap, enable: false)
  CFRunLoopRemoveSource(CFRunLoopGetMain(), source, .commonModes)
  exit(0)
}
signalSource.resume()

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
app.run()
