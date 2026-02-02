import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Logo Mark */}
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-primary-foreground"
            >
              <motion.path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.circle
                cx="12"
                cy="9"
                r="2.5"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              />
            </svg>
          </motion.div>
          
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20"
            animate={{ 
              scale: [1, 1.5],
              opacity: [0.5, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20"
            animate={{ 
              scale: [1, 1.8],
              opacity: [0.3, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3
            }}
          />
        </div>

        {/* Brand Name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">Crowdex</h1>
          <p className="text-sm text-muted-foreground mt-1">Know Before You Go</p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="flex gap-1 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
