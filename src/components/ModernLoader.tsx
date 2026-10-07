"use client";

import React from "react";
import { useTransition } from "@/context/TransitionContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ModernLoaderProps {
  visible?: boolean;
}

/**
 * The full-screen "Talim" loader shown while signing in and between routes,
 * on the tl canvas with the navy tile.
 *
 * @param props - Whether to show it.
 * @param props.visible - Shows it; when left out it follows the route transition.
 * @returns The loader, or nothing.
 */
const ModernLoader: React.FC<ModernLoaderProps> = ({ visible }) => {
  const { isTransitioning } = useTransition();
  const shouldShow = visible !== undefined ? visible : isTransitioning;

  const talimLetters = ["T", "a", "l", "i", "m"];

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-tl-bg/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center space-y-8">
            {/* Logo Container with Glow Effect */}
            <div className="relative">
              {/* Glow Background */}
              <motion.div
                className="absolute inset-0 rounded-full bg-tl-link/40 blur-xl"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />

              {/* Logo Background Circle */}
              <motion.div
                className="relative rounded-[22px] bg-tl-brand-fill p-6 shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)]"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: 0,
                  opacity: 1,
                }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                  },
                  rotate: {
                    duration: 0.6,
                  },
                  opacity: {
                    duration: 0.6,
                  },
                }}
              >
                <Image
                  src="/img/treelogo.svg"
                  alt="Talim Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 filter brightness-0 invert"
                />
              </motion.div>
            </div>

            {/* Bouncing Text */}
            <div className="flex items-center space-x-1">
              {talimLetters.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: 1,
                  }}
                  transition={{
                    y: {
                      duration: 1.5,
                      repeat: Infinity,
                      delay: index * 0.1,
                    },
                    opacity: {
                      duration: 0.3,
                      delay: index * 0.1,
                    },
                  }}
                  className="text-4xl font-extrabold text-tl-ink"
                  style={{
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Loading Text */}
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="h-2 w-2 rounded-full bg-tl-brand-fill"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Progress Bar
            <motion.div
              className="h-1 w-48 overflow-hidden rounded-full bg-tl-track"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 192 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full bg-tl-link"
                animate={{
                  x: [-192, 192],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
            </motion.div> */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModernLoader;
