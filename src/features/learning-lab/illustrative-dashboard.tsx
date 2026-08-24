const burnoutWords = ["overwhelmed", "exhausted", "emotional eating", "brain fog", "anxious", "disconnected", "numb"];
const resetWords = ["walking", "eating more plants", "nature", "sleep", "cooking at home", "family", "yoga"];

export function IllustrativeDashboard({ onContribute }: { onContribute: () => void }) {
  return (
    <div className="dashboard">
      <section className="dashboard__section dashboard__section--dark">
        <p className="eyebrow eyebrow--orange">Illustrative prototype data</p>
        <h2>This is what it feels like</h2>
        <p>The live Learning Lab backend is intentionally deferred.</p>
        <div className="word-cloud">
          {burnoutWords.map((word, index) => <span style={{ fontSize: `${1.1 + (burnoutWords.length - index) * 0.14}rem` }} key={word}>{word}</span>)}
        </div>
      </section>
      <section className="dashboard__section dashboard__section--peach">
        <p className="eyebrow">Illustrative prototype data</p>
        <h2>And this is what helps</h2>
        <div className="word-cloud word-cloud--reset">
          {resetWords.map((word, index) => <span style={{ fontSize: `${1.1 + (resetWords.length - index) * 0.14}rem` }} key={word}>{word}</span>)}
        </div>
      </section>
      <section className="dashboard__section dashboard__section--coral">
        <h2>Add your RESET</h2>
        <p>The picture grows because people answer.</p>
        <button type="button" className="button button--light" onClick={onContribute}>Contribute another RESET</button>
      </section>
    </div>
  );
}
