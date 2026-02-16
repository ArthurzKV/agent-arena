interface FighterScores {
  correctness: number;
  quality: number;
  completeness: number;
  style: number;
  total: number;
}

interface Props {
  show: boolean;
  fighter1: FighterScores;
  fighter2: FighterScores;
}

export default function JudgeVerdict({ show, fighter1, fighter2 }: Props) {
  if (!show) return null;

  const categories = ['correctness', 'quality', 'completeness', 'style'] as const;
  const maxScores = { correctness: 10, quality: 10, completeness: 10, style: 5 };

  return (
    <div className="judge-verdict">
      <div className="verdict-title">SCORECARD</div>
      <div className="scorecard">
        <div className="scorecard-header">
          <span>ALPHA</span>
          <span>CATEGORY</span>
          <span>OMEGA</span>
        </div>
        {categories.map(cat => (
          <div key={cat} className="scorecard-row">
            <span className={fighter1[cat] > fighter2[cat] ? 'score-winner' : fighter1[cat] < fighter2[cat] ? 'score-loser' : ''}>
              {fighter1[cat]}/{maxScores[cat]}
            </span>
            <span className="score-category">{cat.toUpperCase()}</span>
            <span className={fighter2[cat] > fighter1[cat] ? 'score-winner' : fighter2[cat] < fighter1[cat] ? 'score-loser' : ''}>
              {fighter2[cat]}/{maxScores[cat]}
            </span>
          </div>
        ))}
        <div className="scorecard-row total">
          <span className={fighter1.total > fighter2.total ? 'score-winner' : 'score-loser'}>
            {fighter1.total}
          </span>
          <span className="score-category">TOTAL</span>
          <span className={fighter2.total > fighter1.total ? 'score-winner' : 'score-loser'}>
            {fighter2.total}
          </span>
        </div>
      </div>
    </div>
  );
}
