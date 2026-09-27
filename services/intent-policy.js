// Action mode is opt-in through a command at the start of the utterance.
// This gate never turns ordinary prose into an action based on an LLM guess.
function actionPolicy(transcription) {
  const original = transcription.trim();
  let command = original.toLowerCase();
  command = command.replace(/^(?:hey|hi|hello)[,\s]+/, '');
  command = command.replace(/^mily[,\s]+/, '');
  command = command.replace(/^(?:(?:can|could|would|will) you\s+)?(?:please\s+)?/, '');
  const match = /^(open|search|play)\s+(.+)/s.exec(command);
  if (!match || /["“”]/.test(original) || /\b(?:do not|don't|dont|never|instead of|without opening|without searching|without playing)\b/.test(command)) {
    return { mode: 'transcript', allowed: [], reason: 'No unambiguous opening command' };
  }
  const [, verb, target] = match;
  const site = /^(google|youtube)[.!?]*$/.exec(target.trim());
  if (verb === 'open' && site) {
    return {
      mode: 'action', allowed: ['open_link'], reason: 'Explicit website command',
      directAction: { action: 'open_url', url: `https://www.${site[1]}.com/`, linkName: site[1] },
    };
  }
  const youtube = /\byou\s*tube\b/.test(target);
  const google = /\bgoogle\b/.test(target);
  let allowed;
  if (verb === 'play') allowed = ['play_youtube'];
  else if (verb === 'search') allowed = youtube ? ['search_youtube'] : ['search_google'];
  else if (youtube) allowed = ['search_youtube', 'play_youtube', 'open_link'];
  else if (google) allowed = ['search_google', 'open_link'];
  else allowed = ['open_link', 'open_app'];
  return { mode: 'action', allowed, reason: `Explicit ${verb} command` };
}
module.exports = { actionPolicy };
