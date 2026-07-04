export function Toast({ msg }) {
  return <div class={'notification is-dark toast' + (msg ? ' show' : '')}>{msg}</div>;
}
