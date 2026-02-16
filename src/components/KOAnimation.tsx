import { motion, AnimatePresence } from 'motion/react';

interface Props {
  show: boolean;
  knockout: boolean;
  winner: 1 | 2;
  reasoning: string;
  onDismiss: () => void;
}

export default function KOAnimation({ show, knockout, winner, reasoning, onDismiss }: Props) {
  const winnerName = winner === 1 ? 'AGENT ALPHA' : 'AGENT OMEGA';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`ko-overlay ${knockout ? 'knockout' : 'decision'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          style={{ cursor: 'pointer' }}
        >
          {knockout ? (
            <motion.div
              className="ko-text"
              initial={{ scale: 5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            >
              K.O.
            </motion.div>
          ) : (
            <motion.div
              className="decision-text"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              DECISION
            </motion.div>
          )}
          <motion.div
            className="winner-name"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {winnerName} WINS!
          </motion.div>
          <motion.div
            className="reasoning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {reasoning}
          </motion.div>
          <motion.div
            className="dismiss-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            CLICK ANYWHERE TO CONTINUE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
