"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { libraryService } from "@/services/libraryService";
import { mockKnowledgeArticles, mockTrainingCourses } from "@/utils/mockData";
import type { KnowledgeArticle, KnowledgeCategory, TrainingCourse } from "@/utils/types";

function progressWidthClass(progress: number): string {
  const p = Math.max(0, Math.min(100, Math.round(progress / 5) * 5));
  const map: Record<number, string> = {
    0: "w-0",
    5: "w-[5%]",
    10: "w-[10%]",
    15: "w-[15%]",
    20: "w-[20%]",
    25: "w-1/4",
    30: "w-[30%]",
    35: "w-[35%]",
    40: "w-2/5",
    45: "w-[45%]",
    50: "w-1/2",
    55: "w-[55%]",
    60: "w-3/5",
    65: "w-[65%]",
    70: "w-[70%]",
    75: "w-3/4",
    80: "w-4/5",
    85: "w-[85%]",
    90: "w-[90%]",
    95: "w-[95%]",
    100: "w-full"
  };
  return map[p] ?? "w-0";
}

function CourseCard({
  course,
  onSelect,
  progress
}: {
  course: TrainingCourse;
  onSelect: () => void;
  progress: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col items-start rounded-2xl bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        {course.level} • {course.petType}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{course.title}</p>
      <p className="mt-1 text-xs text-ink-600">{course.estimatedMinutes} min · Step-by-step lessons</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={"h-full rounded-full bg-brand-500 transition-all " + progressWidthClass(progress)}
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-600">{progress.toFixed(0)}% complete</p>
    </button>
  );
}

function LibraryInner() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [petType, setPetType] = useState<"Dog" | "Cat">("Dog");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | "All">("All");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const loadLibraryData = async () => {
    setIsLoading(true);
    setHasLoadError(false);
    try {
      const [courseData, articleData] = await Promise.all([
        libraryService.listTrainingCourses(),
        libraryService.listKnowledgeArticles()
      ]);
      setCourses(courseData);
      setArticles(articleData);

      const firstType = courseData[0]?.petType;
      if (firstType === "Dog" || firstType === "Cat") {
        setPetType(firstType);
      }
    } catch {
      setHasLoadError(true);
      // Graceful fallback keeps the learning/library experience intact.
      setCourses(mockTrainingCourses);
      setArticles(mockKnowledgeArticles);
      toast.error("Live data unavailable. Showing offline learning records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLibraryData();
  }, []);

  const filteredCourses = useMemo(
    () => courses.filter((c) => c.petType === petType),
    [courses, petType]
  );

  const availableCourseTypes = useMemo(
    () => Array.from(new Set(courses.map((c) => c.petType))),
    [courses]
  );

  useEffect(() => {
    if (!filteredCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(filteredCourses[0]?.id ?? null);
    }
  }, [filteredCourses, selectedCourseId]);

  const selectedCourse = useMemo(
    () => filteredCourses.find((c) => c.id === selectedCourseId) ?? filteredCourses[0],
    [filteredCourses, selectedCourseId]
  );

  useEffect(() => {
    const firstLessonId = selectedCourse?.lessons.slice().sort((a, b) => a.order - b.order)[0]?.id ?? null;
    if (firstLessonId && !selectedCourse?.lessons.some((l) => l.id === selectedLessonId)) {
      setSelectedLessonId(firstLessonId);
    }
  }, [selectedCourse, selectedLessonId]);

  const selectedLesson = useMemo(
    () => selectedCourse?.lessons.find((lesson) => lesson.id === selectedLessonId),
    [selectedCourse, selectedLessonId]
  );

  const progressByCourse = useMemo(() => {
    const result: Record<string, number> = {};
    for (const course of filteredCourses) {
      const total = course.lessons.length || 1;
      const done = course.lessons.filter((l) => completedLessons[l.id]).length;
      result[course.id] = (done / total) * 100;
    }
    return result;
  }, [completedLessons, filteredCourses]);

  const categories = useMemo<Array<KnowledgeCategory | "All">>(() => {
    const uniqueCategories = Array.from(new Set(articles.map((article) => article.category))) as KnowledgeCategory[];
    return ["All", ...uniqueCategories];
  }, [articles]);

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) =>
        selectedCategory === "All" ? true : article.category === selectedCategory
      ),
    [articles, selectedCategory]
  );

  useEffect(() => {
    if (!filteredArticles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(filteredArticles[0]?.id ?? null);
    }
  }, [filteredArticles, selectedArticleId]);

  const selectedArticle = useMemo(
    () => filteredArticles.find((article) => article.id === selectedArticleId) ?? filteredArticles[0],
    [filteredArticles, selectedArticleId]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex justify-center">
          <Loader label="Loading learning and library content..." />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Learning & library</h1>
          <p className="mt-1 text-sm text-ink-700">
            Step-by-step training for your pet, plus expert-reviewed articles.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-ink-100 p-1 text-xs">
          {availableCourseTypes.length > 0 ? availableCourseTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={
                "rounded-xl px-3 py-1.5 font-medium " +
                (petType === type ? "bg-white text-ink-900 shadow-soft" : "text-ink-700 hover:bg-ink-200")
              }
              onClick={() => setPetType(type)}
            >
              {type}-focused learning
            </button>
          )) : (
            <span className="rounded-xl px-3 py-1.5 text-ink-600">No focused learning data</span>
          )}
        </div>
      </div>

      {hasLoadError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          Could not load real-time library records. Please retry.
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => void loadLibraryData()}>
              Retry loading data
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr,1.5fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink-900">Training courses</h2>
          <div className="space-y-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={() => setSelectedCourseId(course.id)}
                progress={progressByCourse[course.id] ?? 0}
              />
            ))}
            {filteredCourses.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-ink-600 shadow-soft">
                No courses for this pet type yet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-ink-900">
              {selectedCourse?.title ?? "Select a course"}
            </h2>
            {selectedCourse ? (
              <>
                <p className="mt-1 text-xs text-ink-600">
                  Designed for {selectedCourse.petType.toLowerCase()} guardians at a{" "}
                  {selectedCourse.level.toLowerCase()} level.
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={
                      "h-full rounded-full bg-brand-500 transition-all " +
                      progressWidthClass(progressByCourse[selectedCourse.id] ?? 0)
                    }
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-600">
                  {(progressByCourse[selectedCourse.id] ?? 0).toFixed(0)}% course progress
                </p>
                <ol className="mt-4 space-y-3">
                  {selectedCourse.lessons
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => {
                      const done = completedLessons[lesson.id];
                      return (
                        <li
                          key={lesson.id}
                          className={
                            "flex items-start gap-3 rounded-xl border px-3 py-2 text-sm transition-colors " +
                            (selectedLesson?.id === lesson.id
                              ? "border-brand-200 bg-brand-50 dark:border-brand-700/50 dark:bg-brand-900/35"
                              : "border-ink-200 bg-ink-50 dark:border-ink-300/60 dark:bg-ink-100")
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCompletedLessons((prev) => ({
                                ...prev,
                                [lesson.id]: !prev[lesson.id]
                              }))
                            }
                            className={
                              "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                              (done
                                ? "border-brand-500 bg-brand-500 text-white"
                                : "border-ink-300 bg-white text-ink-500 dark:border-ink-400 dark:bg-ink-50 dark:text-ink-700")
                            }
                          >
                            {done ? "✓" : lesson.order}
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-lg px-1 py-1 text-left"
                            onClick={() => setSelectedLessonId(lesson.id)}
                          >
                            <p className="font-medium text-ink-900 dark:text-white">{lesson.title}</p>
                            <p className="mt-1 text-xs text-ink-700 dark:text-ink-200">{lesson.description}</p>
                          </button>
                        </li>
                      );
                    })}
                </ol>
                {selectedLesson ? (
                  <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      Current lesson
                    </p>
                    <h3 className="mt-1 font-semibold text-ink-900">{selectedLesson.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-700">
                      {selectedLesson.description}
                    </p>
                    {selectedLesson.videoUrl ? (
                      <a
                        href={selectedLesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        Watch lesson video
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-4 text-[11px] text-ink-600">
                  This guidance does not replace working with a qualified trainer, especially for
                  aggression, reactivity, or complex behavior issues.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-600">
                Select a course on the left to view its lessons.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink-900">Knowledge library</h2>
              <Button size="sm" variant="secondary" onClick={() => setSelectedCategory("All")}>Browse all</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={
                    "rounded-full px-3 py-1 " +
                    (selectedCategory === cat
                      ? "bg-brand-100 text-brand-900"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-200")
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className={
                    "flex cursor-pointer flex-col rounded-xl p-3 text-xs text-ink-700 " +
                    (selectedArticle?.id === article.id ? "bg-brand-50" : "bg-ink-50")
                  }
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {article.category}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink-900">{article.title}</h3>
                  <p className="mt-1 line-clamp-3">{article.summary}</p>
                  <p className="mt-2 text-[11px] text-ink-600">Reviewed by {article.expert}</p>
                </article>
              ))}
              {filteredArticles.length === 0 ? (
                <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
                  No articles available for this category.
                </div>
              ) : null}
            </div>
            {selectedArticle ? (
              <div className="mt-4 rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                  {selectedArticle.category}
                </p>
                <h3 className="mt-1 text-base font-semibold text-ink-900">{selectedArticle.title}</h3>
                <p className="mt-1 text-xs text-ink-600">Expert reviewer: {selectedArticle.expert}</p>
                {selectedArticle.imageUrl ? (
                  <div className="mt-3 overflow-hidden rounded-xl bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedArticle.imageUrl}
                      alt={selectedArticle.title}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-ink-700">{selectedArticle.body}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryInner />
    </ProtectedRoute>
  );
}

