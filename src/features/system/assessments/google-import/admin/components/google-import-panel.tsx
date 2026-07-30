"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormType } from "@/drizzle/schema";
import { formTypeValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import type { MappedForm } from "@/features/system/assessments/google-import/lib";
import { useTRPC } from "@/integrations/trpc/client";
import { GoogleFormPreview } from "./google-form-preview";

const NONE = "__none__";
const LIST_INPUT = { page: 1, perPage: 100, sorting: [] };

/**
 * Paste a link → see what would be imported → choose where it goes → import.
 *
 * The preview is a separate step rather than an import that reports afterwards
 * because a Google form routinely contains question kinds this app has no
 * equivalent for; the admin should see what will be lost while nothing has
 * been written yet.
 */
export function GoogleImportPanel() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const linkFieldId = useId();

  const [formLink, setFormLink] = useState("");
  const [preview, setPreview] = useState<MappedForm | null>(null);
  const [type, setType] = useState<FormType>("quiz");
  const [titleOverride, setTitleOverride] = useState("");
  const [courseId, setCourseId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [lectureId, setLectureId] = useState("");
  const isImportingRef = useRef(false);

  const previewMut = useMutation(trpc.googleImport.preview.mutationOptions());
  const importMut = useMutation(trpc.googleImport.import.mutationOptions());

  const { data: coursesData } = useQuery(
    trpc.courses.list.queryOptions(LIST_INPUT),
  );
  const { data: levels } = useQuery(
    trpc.levels.list.queryOptions({ courseId }, { enabled: courseId !== "" }),
  );
  const { data: lectures } = useQuery(
    trpc.lectures.list.queryOptions({ levelId }, { enabled: levelId !== "" }),
  );

  /**
   * Editing the link drops the preview with it. The import sends the link,
   * not the previewed structure, so leaving a preview on screen after the
   * field changed would let someone import a form they never looked at.
   */
  const handleLinkChange = useCallback((value: string) => {
    setFormLink(value);
    setPreview(null);
  }, []);

  const handlePreview = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formLink.trim()) return;

      try {
        const result = await previewMut.mutateAsync({ formLink });
        setPreview(result);
        // A fresh form gets its own title back; anything typed for the
        // previous one would silently rename this one.
        setTitleOverride("");
      } catch (error) {
        setPreview(null);
        toast.error(
          error instanceof Error
            ? error.message
            : t("googleImport.previewFailed"),
        );
      }
    },
    [formLink, previewMut, t],
  );

  const handleImport = useCallback(async () => {
    // `importMut.isPending` only disables the button on the *next* render, so
    // a fast double-click can fire this twice and create the assessment twice.
    // The ref flips synchronously, before either dispatch settles.
    if (isImportingRef.current) return;
    isImportingRef.current = true;

    try {
      const created = await toast
        .promise(
          importMut.mutateAsync({
            formLink,
            type,
            titleOverride,
            courseId: courseId || null,
            levelId: levelId || null,
            lectureId: lectureId || null,
          }),
          {
            loading: t("googleImport.importing"),
            success: t("googleImport.imported"),
            error: (err) =>
              err instanceof Error
                ? err.message
                : t("googleImport.importFailed"),
          },
        )
        .unwrap();

      await queryClient.invalidateQueries({ queryKey: trpc.forms.pathKey() });
      // Straight into the builder: an imported assessment is a draft that
      // still needs a look before it is published.
      router.push(`/assessments/${created.id}`);
    } catch {
      // toast.promise already surfaced the failure.
    } finally {
      isImportingRef.current = false;
    }
  }, [
    courseId,
    formLink,
    importMut,
    lectureId,
    levelId,
    queryClient,
    router,
    t,
    titleOverride,
    trpc,
    type,
  ]);

  const handleCourseChange = useCallback((value: string) => {
    setCourseId(value === NONE ? "" : value);
    setLevelId("");
    setLectureId("");
  }, []);

  const handleLevelChange = useCallback((value: string) => {
    setLevelId(value === NONE ? "" : value);
    setLectureId("");
  }, []);

  const isImportable = preview !== null && preview.questionCount > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("googleImport.importTitle")}</CardTitle>
          <CardDescription>
            {t("googleImport.importDescription")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handlePreview}>
          <CardContent>
            <FieldSet disabled={previewMut.isPending}>
              <Field>
                <FieldLabel htmlFor={linkFieldId}>
                  {t("googleImport.formLink")}
                </FieldLabel>
                <Input
                  id={linkFieldId}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  dir="ltr"
                  placeholder={t("googleImport.formLinkPlaceholder")}
                  value={formLink}
                  onChange={(event) => handleLinkChange(event.target.value)}
                />
                <FieldDescription>
                  {t("googleImport.importDescription")}
                </FieldDescription>
              </Field>
            </FieldSet>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={previewMut.isPending || formLink.trim() === ""}
            >
              {previewMut.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SearchIcon className="size-4" />
              )}
              {preview
                ? t("googleImport.previewAgain")
                : t("googleImport.preview")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {preview && <GoogleFormPreview preview={preview} />}

      {isImportable && (
        <Card>
          <CardHeader>
            <CardTitle>{t("googleImport.targetTitle")}</CardTitle>
            <CardDescription>
              {t("googleImport.targetDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FieldSet disabled={importMut.isPending}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="google-import-type">
                    {t("assessments.type")}
                  </FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as FormType)}
                  >
                    <SelectTrigger id="google-import-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formTypeValues.map((value: FormType) => (
                        <SelectItem key={value} value={value}>
                          {t(`assessments.typeOptions.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>{t("googleImport.titleOverride")}</FieldLabel>
                  <Input
                    value={titleOverride}
                    maxLength={256}
                    placeholder={preview.title}
                    onChange={(event) => setTitleOverride(event.target.value)}
                  />
                  <FieldDescription>
                    {t("googleImport.titleOverrideDescription")}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="google-import-attach-course">
                    {t("assessments.attachToCourse")}
                  </FieldLabel>
                  <Select
                    value={courseId || NONE}
                    onValueChange={(value) =>
                      handleCourseChange(value as string)
                    }
                  >
                    <SelectTrigger id="google-import-attach-course">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {t("assessments.notAttached")}
                      </SelectItem>
                      {(coursesData?.rows ?? []).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {courseId !== "" && (
                  <Field>
                    <FieldLabel htmlFor="google-import-attach-level">
                      {t("assessments.attachToLevel")}
                    </FieldLabel>
                    <Select
                      value={levelId || NONE}
                      onValueChange={(value) =>
                        handleLevelChange(value as string)
                      }
                    >
                      <SelectTrigger id="google-import-attach-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>
                          {t("assessments.notAttached")}
                        </SelectItem>
                        {(levels ?? []).map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {levelId !== "" && (
                  <Field>
                    <FieldLabel htmlFor="google-import-attach-lecture">
                      {t("assessments.attachToLecture")}
                    </FieldLabel>
                    <Select
                      value={lectureId || NONE}
                      onValueChange={(value) =>
                        setLectureId(value === NONE || !value ? "" : value)
                      }
                    >
                      <SelectTrigger id="google-import-attach-lecture">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>
                          {t("assessments.notAttached")}
                        </SelectItem>
                        {(lectures ?? []).map((lecture) => (
                          <SelectItem key={lecture.id} value={lecture.id}>
                            {lecture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </FieldGroup>
            </FieldSet>
          </CardContent>

          <CardFooter>
            <Button
              type="button"
              disabled={importMut.isPending}
              onClick={() => void handleImport()}
            >
              {importMut.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
              {t("googleImport.import")}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
