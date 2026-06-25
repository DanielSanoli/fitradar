import { useEffect, useState } from "react";

import { ChevronLeft, Plus, X } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { PanelState } from "@/components/ui/PanelState";

import { useConfirmDialog } from "@/components/ui/confirm-dialog";

import { useToast } from "@/components/ui/toast";

import { usePageTitle } from "@/hooks/usePageTitle";

import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";

import {

  itemContentGridTemplate,

  itemContentToMarkdown,

  markdownToItemContent,

  newItemContentRow,

  type ItemContentRow,

} from "@/lib/item-content";

import { formatItemContentCount } from "@/lib/space/vocabulary";

import { programsApi } from "@/lib/api/programs-api";

import { ApiError } from "@/lib/api/types";

import { cn } from "@/lib/utils";



export function WorkoutFormPage({ mode }: { mode: "create" | "edit" }) {

  const { toast } = useToast();

  const { vocabulary: v } = useSpaceVocabulary();

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const { id: programId = "", workoutId } = useParams();

  const navigate = useNavigate();

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [items, setItems] = useState<ItemContentRow[]>([]);

  const [dayIndex, setDayIndex] = useState(1);

  const [saving, setSaving] = useState(false);

  const [loadState, setLoadState] = useState<"loading" | "error" | "content">(

    mode === "edit" ? "loading" : "content",

  );

  const [loadError, setLoadError] = useState<string>();



  usePageTitle(

    mode === "create" ? v.newItem : title.trim() ? title : v.editItem,

  );



  useEffect(() => {

    if (mode === "create") {

      void programsApi.workouts(programId).then((list) => {

        setDayIndex(list.length + 1);

      });

      return;

    }

    if (!workoutId) return;

    void Promise.all([programsApi.workouts(programId)])

      .then(([list]) => {

        const w = list.find((x) => x.id === workoutId);

        if (!w) throw new Error(`${v.itemTitle} não encontrado`);

        setTitle(w.title);

        setDescription(w.description ?? "");

        setDayIndex(w.dayIndex);

        setItems(markdownToItemContent(w.contentMarkdown, v.contentSchema));

        setLoadState("content");

      })

      .catch((e) => {

        setLoadError(e instanceof ApiError ? e.message : v.itemLoadError);

        setLoadState("error");

      });

  }, [mode, programId, workoutId, v.contentSchema, v.itemLoadError, v.itemTitle]);



  const updateItem = (index: number, patch: Partial<ItemContentRow>) => {

    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  };



  const updateItemField = (index: number, key: string, value: string) => {

    setItems((rows) =>

      rows.map((row, i) =>

        i === index ? { ...row, fields: { ...row.fields, [key]: value } } : row,

      ),

    );

  };



  const removeItem = async (index: number) => {

    const row = items[index];

    if (row.name.trim()) {

      const ok = await confirm({

        title: v.removeContentConfirmTitle,

        description: `“${row.name.trim()}” ${v.removeContentConfirmDescription}`,

        confirmLabel: "Remover",

        destructive: true,

      });

      if (!ok) return;

    }

    setItems((rows) => rows.filter((_, i) => i !== index));

  };



  const deleteWorkout = async () => {

    if (!workoutId) return;

    const ok = await confirm({

      title: v.deleteItemConfirmTitle,

      description: v.deleteItemConfirmDescription,

      confirmLabel: v.deleteItemConfirmLabel,

      destructive: true,

    });

    if (!ok) return;

    try {

      await programsApi.removeWorkout(programId, workoutId);

      toast(v.itemDeleted);

      navigate(`/app/programs/${programId}`);

    } catch (err) {

      toast(err instanceof ApiError ? err.message : v.itemSaveError, "error");

    }

  };



  const submit = async (e: React.FormEvent) => {

    e.preventDefault();

    setSaving(true);

    const body = {

      title: title.trim() || v.defaultItemTitle,

      description: description.trim() || null,

      contentMarkdown: itemContentToMarkdown(items, v.contentSchema) || null,

      dayIndex,

    };

    try {

      if (mode === "create") {

        await programsApi.createWorkout(programId, body);

      } else if (workoutId) {

        await programsApi.updateWorkout(programId, workoutId, body);

      }

      navigate(`/app/programs/${programId}`);

    } catch (err) {

      toast(err instanceof ApiError ? err.message : v.itemSaveError, "error");

    } finally {

      setSaving(false);

    }

  };



  if (loadState !== "content") {

    return (

      <PanelState

        state={loadState}

        message={loadError}

        onRetry={() => setLoadState("loading")}

        rows={3}

      />

    );

  }



  const heading = mode === "create" ? v.newItem : v.editItem;

  const saveLabel = mode === "create" ? v.addItem : "Salvar alterações";

  const itemCount = formatItemContentCount(items.length, v);

  const gridTemplate = itemContentGridTemplate(v.contentFields);



  return (

    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 animate-in fade-in duration-300">

      {confirmDialog}

      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">

        <Link to={`/app/programs/${programId}`}>

          <ChevronLeft className="size-4" />

          {v.backToProgram}

        </Link>

      </Button>



      <form

        onSubmit={(e) => void submit(e)}

        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-[0_6px_24px_rgba(0,0,0,0.28)] md:p-8"

      >

        <div>

          <h1 className="text-[22px] font-extrabold tracking-tight">{heading}</h1>

          <p className="mt-1.5 text-sm text-muted-foreground">{v.addItemDescription}</p>

        </div>



        <div className="flex flex-wrap gap-4">

          <div className="min-w-[240px] flex-1 space-y-1.5">

            <Label htmlFor="wk-title">{v.itemTitleLabel}</Label>

            <Input

              id="wk-title"

              required

              value={title}

              onChange={(e) => setTitle(e.target.value)}

              placeholder={v.itemTitlePlaceholder}

              className="h-[46px] rounded-[11px] bg-secondary/40"

            />

          </div>

          <div className="min-w-[260px] flex-[1.5] space-y-1.5">

            <Label htmlFor="wk-desc">Descrição curta</Label>

            <Input

              id="wk-desc"

              value={description}

              onChange={(e) => setDescription(e.target.value)}

              placeholder={v.itemDescriptionPlaceholder}

              className="h-[46px] rounded-[11px] bg-secondary/40"

            />

          </div>

        </div>



        <div className="space-y-3.5">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <span className="text-[15px] font-bold">{v.itemContent}</span>

              <span className="ml-2.5 text-[13px] text-muted-foreground">{itemCount}</span>

            </div>

            <Button

              type="button"

              variant="outline"

              className="h-9 gap-1.5 rounded-[9px] border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"

              onClick={() => setItems((rows) => [...rows, newItemContentRow(v.contentSchema)])}

            >

              <Plus className="size-3.5" strokeWidth={2.5} />

              {v.addContentButton}

            </Button>

          </div>



          {items.length === 0 ? (

            <div className="rounded-[12px] border border-dashed border-border bg-secondary/20 px-5 py-8 text-center text-sm text-muted-foreground">

              {v.noContentAdded}

            </div>

          ) : (

            <div className="overflow-hidden rounded-[12px] border border-border bg-secondary/20">

              <div

                className="hidden gap-2 border-b border-border px-4 py-2 sm:grid"

                style={{ gridTemplateColumns: gridTemplate }}

              >

                {[v.contentColumnHeader, ...v.contentFields.map((field) => field.label), ""].map(

                  (header) => (

                    <span

                      key={header || "actions"}

                      className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"

                    >

                      {header}

                    </span>

                  ),

                )}

              </div>

              {items.map((row, index) => (

                <div

                  key={row.id}

                  className={cn(

                    "grid grid-cols-1 gap-2 border-b border-border/80 px-4 py-2.5 last:border-b-0 sm:items-center",

                    "sm:grid",

                  )}

                  style={{ gridTemplateColumns: gridTemplate }}

                >

                  <Input

                    value={row.name}

                    onChange={(e) => updateItem(index, { name: e.target.value })}

                    placeholder={v.contentNamePlaceholder}

                    className="h-[38px] rounded-[9px] bg-card text-[13.5px]"

                  />

                  {v.contentFields.map((field) => (

                    <Input

                      key={field.key}

                      value={row.fields[field.key] ?? ""}

                      onChange={(e) => updateItemField(index, field.key, e.target.value)}

                      placeholder={field.placeholder}

                      className={cn(

                        "h-[38px] rounded-[9px] bg-card text-[13.5px]",

                        v.contentSchema === "fitness" && "text-center",

                      )}

                      aria-label={`${field.label} — ${row.name.trim() || v.contentNamePlaceholder}`}

                    />

                  ))}

                  <button

                    type="button"

                    onClick={() => void removeItem(index)}

                    className="flex size-[34px] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"

                    aria-label={`Remover ${v.itemContentSingular} ${row.name.trim() || index + 1}`}

                  >

                    <X className="size-4" />

                  </button>

                </div>

              ))}

            </div>

          )}

        </div>



        <div className="h-px bg-border" />



        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap gap-3">

            <Button type="button" variant="outline" className="h-[46px] rounded-[11px] px-5" asChild>

              <Link to={`/app/programs/${programId}`}>Cancelar</Link>

            </Button>

            <Button

              type="submit"

              disabled={saving}

              className="h-[46px] rounded-[11px] px-7 shadow-[0_4px_18px_hsl(var(--primary)/0.28)]"

            >

              {saving ? "Salvando…" : saveLabel}

            </Button>

          </div>

          {mode === "edit" ? (

            <Button

              type="button"

              variant="outline"

              className="h-[46px] rounded-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"

              onClick={() => void deleteWorkout()}

            >

              {v.deleteItem}

            </Button>

          ) : null}

        </div>

      </form>

    </div>

  );

}

