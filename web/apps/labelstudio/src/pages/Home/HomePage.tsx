import type { Page } from "../types/Page";
import { Button } from "@humansignal/shad/components/ui/button";
import { IconFolder, SimpleCard, Spinner } from "@humansignal/ui";
import { IconExternal, IconFolderAdd, IconHumanSignal, IconUserAdd } from "@humansignal/icons";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "../../providers/ApiProvider";
import { useState } from "react";
import { CreateProject } from "../CreateProject/CreateProject";
import { InviteLink } from "../Organization/PeoplePage/InviteLink";
import { Heading, Sub } from "@humansignal/typography";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const PROJECTS_TO_SHOW = 10;

  const resources = [
    {
      title: i18n.t('common_title_documentation'),
      url: "https://labelstud.io/guide/",
    },
    {
      title: i18n.t('common_title_api_documentation'),
      url: "https://api.labelstud.io/api-reference/introduction/getting-started",
    },
    {
      title: i18n.t('common_title_release_notes'),
      url: "https://labelstud.io/learn/categories/release-notes/",
    },
    {
      title: i18n.t('common_title_label_stud.io_blog'),
      url: "https://labelstud.io/blog/",
    },
    {
      title: i18n.t('common_title_slack_community'),
      url: "https://slack.labelstud.io",
    },
  ];

  const actions = [
    {
      title: i18n.t('common_button_create_project'),
      icon: IconFolderAdd,
      type: "createProject",
    },
    {
      title: i18n.t('common_button_invite_people'),
      icon: IconUserAdd,
      type: "invitePeople",
    },
  ] as const;

  type Action = (typeof actions)[number]["type"];

export const HomePage: Page = () => {
  const api = useAPI();
  const { t } = useTranslation();
  const [creationDialogOpen, setCreationDialogOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const { data, isFetching, isSuccess, isError } = useQuery({
    queryKey: ["projects", { page_size: 10 }],
    async queryFn() {
      return api.callApi<{ results: APIProject[]; count: number }>("projects", {
        params: { page_size: PROJECTS_TO_SHOW },
      });
    },
  });

  const handleActions = (action: Action) => {
    return () => {
      switch (action) {
        case "createProject":
          setCreationDialogOpen(true);
          break;
        case "invitePeople":
          setInvitationOpen(true);
          break;
      }
    };
  };

  return (
    <main className="p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_450px] gap-6">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Heading size={1}>{t('common_title_welcome')} 👋</Heading>
            <Sub>{t('common_subtitle_get_started_tip')}</Sub>
          </div>
          <div className="flex justify-start gap-4">
            {actions.map((action) => {
              return (
                <Button
                  key={action.title}
                  className="flex-grow-0 text-lsLabelMedium text-lsPrimaryContent text-left justify-start min-w-[250px] [&_svg]:w-6 [&_svg]:h-6"
                  variant="lsOutline"
                  onClick={handleActions(action.type)}
                >
                  <action.icon className="text-lsPrimaryIcon" />
                  {action.title}
                </Button>
              );
            })}
          </div>

          <SimpleCard
            title={
              data && data?.count > 0 ? (
                <>
                {t('common_title_recent_projects')}
                  <a href="/projects" className="text-lg font-normal hover:underline">
                  {t('common_button_view_all')}
                  </a>
                </>
              ) : null
            }
          >
            {isFetching ? (
              <div className="h-64 flex justify-center items-center">
                <Spinner />
              </div>
            ) : isError ? (
              <div className="h-64 flex justify-center items-center">{t('common_tip_load_project_error')}</div>
            ) : isSuccess && data.results.length === 0 ? (
              <div className="flex flex-col justify-center items-center border border-lsBorderSubtle bg-lsPrimaryEmphasisSubtle rounded-lg h-64">
                <div
                  className={
                    "rounded-full w-12 h-12 flex justify-center items-center bg-lsAccentGrapeSubtle text-lsPrimaryIcon"
                  }
                >
                  <IconFolder />
                </div>
                <Heading size={2}>{t('common_title_create_first_project')}</Heading>
                <Sub>{t('common_subtitle_import_data_first')}</Sub>
                <Button className="mt-4" onClick={() => setCreationDialogOpen(true)}>
                  {t('common_button_create_project')}
                </Button>
              </div>
            ) : isSuccess && data.results.length > 0 ? (
              <div className="flex flex-col gap-1">
                {data.results.map((project) => {
                  return <ProjectSimpleCard key={project.id} project={project} />;
                })}
              </div>
            ) : null}
          </SimpleCard>
        </section>
        <section className="flex flex-col gap-6">
          <HeidiTips collection="projectSettings" />
          <SimpleCard title={t('common_title_resources')} description={t('common_subtitle_resources_description')}>
            <ul>
              {resources.map((link) => {
                return (
                  <li key={link.title}>
                    <a
                      href={link.url}
                      className="py-2 px-1 flex justify-between items-center text-lsNeutralContent"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.title}
                      <IconExternal className="text-lsPrimaryIcon" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </SimpleCard>
          <div className="flex gap-2 items-center">
            <IconHumanSignal />
            <span className="text-lsNeutralContentSubtle">Label Studio Version: Community</span>
          </div>
        </section>
      </div>
      {creationDialogOpen && <CreateProject redirect={false} onClose={() => setCreationDialogOpen(false)} />}
      <InviteLink opened={invitationOpen} onClosed={() => setInvitationOpen(false)} />
    </main>
  );
};

HomePage.title = "Home";
HomePage.path = "/";
HomePage.exact = true;

function ProjectSimpleCard({
  project,
}: {
  project: APIProject;
}) {
  const finished = project.finished_task_number ?? 0;
  const total = project.task_number ?? 0;
  const progress = (total > 0 ? finished / total : 0) * 100;
  const white = "#FFFFFF";
  const color = project.color && project.color !== white ? project.color : "#E1DED5";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block even:bg-neutral-surface rounded-sm overflow-hidden"
      data-external
    >
      <div
        className="grid grid-cols-[minmax(0,1fr)_150px] p-2 py-3 items-center border-l-[3px]"
        style={{ borderLeftColor: color }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-lsNeutralContent">{project.title}</span>
          <div className="text-lsNeutralContentSubtler text-sm">
            {finished} of {total} Tasks ({total > 0 ? Math.round((finished / total) * 100) : 0}%)
          </div>
        </div>
        <div className="bg-lsNeutralSurface rounded-full overflow-hidden w-full h-2 shadow-lsNeutralBorderSubtle shadow-border-1">
          <div className="bg-lsPositiveSurfaceHover h-full" style={{ maxWidth: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}
