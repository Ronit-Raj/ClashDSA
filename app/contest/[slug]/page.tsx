"use client";

import Editor from "@monaco-editor/react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { Contest } from "@/app/types";
import { Socket,io } from "socket.io-client";

type Language = {
  label: string;
  monaco: string;
  judge0Id: number;
  starter: string;
};

const languages: Language[] = [
  {
    label: "C++",
    monaco: "cpp",
    judge0Id: 54,
    starter: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n",
  },
  {
    label: "C",
    monaco: "c",
    judge0Id: 50,
    starter: "#include <stdio.h>\n\nint main(void) {\n    return 0;\n}\n",
  },
  {
    label: "Java",
    monaco: "java",
    judge0Id: 62,
    starter: "import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n    }\n}\n",
  },
  {
    label: "Python",
    monaco: "python",
    judge0Id: 71,
    starter: "def solve():\n    pass\n\nif __name__ == \"__main__\":\n    solve()\n",
  },
  {
    label: "JavaScript",
    monaco: "javascript",
    judge0Id: 63,
    starter: "const fs = require(\"fs\");\nconst input = fs.readFileSync(0, \"utf8\").trim();\n\nfunction solve() {\n}\n\nsolve();\n",
  },
  {
    label: "Go",
    monaco: "go",
    judge0Id: 60,
    starter: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println()\n}\n",
  },
];

function extractBodyHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.innerHTML || html;
}

export default function ContestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [contest, setContest] = useState<Contest | null>(null);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [statementHtmlByProblem, setStatementHtmlByProblem] = useState<
    Record<number, string>
  >({});
  const [statementError, setStatementError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [codeByProblem, setCodeByProblem] = useState<Record<number, string>>(
    {},
  );
  const totalTestCases = useRef<number>(0);
  const [solvedCases, setSolvedCases] = useState(0);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socket = useRef<Socket | null>(null);
  const problemId = contest?.problems[currentProblem];
  const code = problemId
    ? codeByProblem[problemId] ?? selectedLanguage.starter
    : "";

  const progressLabel = useMemo(() => {
    if (!contest?.problems.length) return "Problem 0 of 0";
    return `Problem ${currentProblem + 1} of ${contest.problems.length}`;
  }, [contest?.problems.length, currentProblem]);

  useEffect(() => {
    let ignore = false;

    async function fetchContest() {
      const res = await apiFetch(`/v1/api/contest/${slug}`);
      const data: Contest = await res.json();
      if (!ignore) setContest(data);
    }

    fetchContest().catch(() => {
      if (!ignore) setContest(null);
    });

    // socket event listener
    socket.current = io("http://57.158.25.157:3000");
      socket.current.on("codeResult", (data) => {
        // debugger
        if (data.status.id === 3 && solvedCases !== -1) {
            setSolvedCases((prev) => prev + 1);
            setSubmitMessage(`${solvedCases} / ${totalTestCases.current} solved`);
            // console.log(`${solvedCases} / ${totalTestCases.current} solved`);
            if (solvedCases === totalTestCases.current) {
              setIsSubmitting(false);
            }
        } else if (solvedCases !== -1) {
            setSubmitMessage(`${data.status.description} on Test case ${solvedCases+1}`);
            setSolvedCases(-1);
            setIsSubmitting(false);
            // console.log(data.status.description);
        }
    });

      
    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!problemId || statementHtmlByProblem[problemId]) return;

    let ignore = false;
    const selectedProblemId = problemId;

    async function fetchStatement() {
      setStatementError(null);
      const res = await fetch(`/${selectedProblemId}/statement.html`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to load statement");

      const html = extractBodyHtml(await res.text());
      if (!ignore) {
        setStatementHtmlByProblem((prev) => ({
          ...prev,
          [selectedProblemId]: html,
        }));
      }
    }

    fetchStatement().catch(() => {
      if (!ignore) setStatementError("Problem statement could not be loaded.");
    });

    return () => {
      ignore = true;
    };
  }, [problemId, statementHtmlByProblem]);

  function handleLanguageChange(languageLabel: string) {
    const nextLanguage =
      languages.find((language) => language.label === languageLabel) ??
      languages[0];

    setSelectedLanguage(nextLanguage);
    if (problemId && !codeByProblem[problemId]) {
      setCodeByProblem((prev) => ({
        ...prev,
        [problemId]: nextLanguage.starter,
      }));
    }
  }

  function moveProblem(direction: -1 | 1) {
    if (!contest?.problems.length) return;

    setSubmitMessage(null);
    setCurrentProblem((prev) => {
      const next = prev + direction;
      if (next < 0) return contest.problems.length - 1;
      if (next >= contest.problems.length) return 0;
      return next;
    });
  }

  async function handleSubmit() {
    if (!contest || !problemId || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await apiFetch("/v1/api/contest/submit", {
        method: "POST",
        body: JSON.stringify({
          contestId: contest.contestId,
          problemId,
          sourceCode: code,
          language: selectedLanguage.judge0Id,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        submissionId?: string;
        totalTestCases?: number;
      };
      
      if (res.status === 202) {
        totalTestCases.current = data.totalTestCases ?? 0;
        socket.current?.emit("joinRoom", data.submissionId);
        return;
      }

      setSubmitMessage(data.message ?? "Submission failed. Please try again.");
    } catch {
      setSubmitMessage("Submission failed. Please try again.");
    } 
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.95fr)]">
        <section className="flex min-h-[50vh] flex-col border-b border-zinc-800 lg:h-screen lg:border-b-0 lg:border-r">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-green-400">
                {progressLabel}
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-zinc-100">
                {contest?.title ?? "Loading contest..."}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveProblem(-1)}
                disabled={!contest?.problems.length}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => moveProblem(1)}
                disabled={!contest?.problems.length}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {statementError ? (
              <div className="rounded-lg border border-red-800/50 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                {statementError}
              </div>
            ) : problemId && statementHtmlByProblem[problemId] ? (
              <article
                className="problem-statement max-w-none text-zinc-200 [&_*]:max-w-full [&_a]:text-green-400 [&_blockquote]:border-l-4 [&_blockquote]:border-green-900 [&_blockquote]:bg-zinc-900 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_body]:bg-transparent [&_body]:text-zinc-200 [&_code]:rounded [&_code]:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-green-300 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-50 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-7 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:bg-zinc-900 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:text-zinc-50 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-800 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{
                  __html: statementHtmlByProblem[problemId],
                }}
              />
            ) : (
              <div className="h-full animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60" />
            )}
          </div>
        </section>

        <section className="flex min-h-[50vh] flex-col bg-zinc-950 lg:h-screen">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Code Editor
              </p>
              <p className="text-sm text-zinc-300">
                Problem ID {problemId ?? "-"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedLanguage.label}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 outline-none transition-shadow [color-scheme:dark] focus:ring-2 focus:ring-green-900"
              >
                {languages.map((language) => (
                  <option key={language.label} value={language.label}>
                    {language.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!contest || !problemId || isSubmitting}
                className="rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </header>

          {submitMessage && (
            <div className="border-b border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-zinc-300">
              {submitMessage}
            </div>
          )}

          <div className="min-h-0 flex-1">
            <Editor
              height="100%"
              language={selectedLanguage.monaco}
              theme="vs-dark"
              value={code}
              onChange={(value) => {
                if (!problemId) return;
                setCodeByProblem((prev) => ({
                  ...prev,
                  [problemId]: value ?? "",
                }));
              }}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
