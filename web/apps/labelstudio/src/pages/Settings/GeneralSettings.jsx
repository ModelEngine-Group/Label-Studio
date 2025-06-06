import { EnterpriseBadge } from "@humansignal/ui";
import { useCallback, useContext } from "react";
import { Button } from "../../components";
import { Form, Input, Select, TextArea } from "../../components/Form";
import { RadioGroup } from "../../components/Form/Elements/RadioGroup/RadioGroup";
import { ProjectContext } from "../../providers/ProjectProvider";
import { Block, Elem } from "../../utils/bem";
import "./settings.scss";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { FF_LSDV_E_297, isFF } from "../../utils/feature-flags";
import { createURL } from "../../components/HeidiTips/utils";
import { Caption } from "../../components/Caption/Caption";
import { useTranslation } from "react-i18next";

export const GeneralSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);
  const { t } = useTranslation();

  const updateProject = useCallback(() => {
    if (project.id) fetchProject(project.id, true);
  }, [project]);

  const colors = ["#FDFDFC", "#FF4C25", "#FF750F", "#ECB800", "#9AC422", "#34988D", "#617ADA", "#CC6FBE"];

  const samplings = [
    {
      value: "Sequential",
      label: t("common_label_sequential"),
      description: "Tasks are ordered by Task ID"
    },
    {
      value: "Uniform",
      label: t("common_label_random"),
      description: "Tasks are chosen with uniform random"
    }
  ];

  return (
    <Block name="general-settings">
      <Elem name={"wrapper"}>
        <h1>{t("common_title_general_settings")}</h1>
        <Block name="settings-wrapper">
          <Form action="updateProject" formData={{ ...project }} params={{ pk: project.id }} onSubmit={updateProject}>
            <Form.Row columnCount={1} rowGap="16px">
              <Input name="title" label={t("common_button_project_name")} />

              <TextArea
                name="description"
                label={t("common_title_description")}
                style={{ minHeight: 128 }}
              />
              {isFF(FF_LSDV_E_297) && (
                <Block name="workspace-placeholder">
                  <Elem name="badge-wrapper">
                    <Elem name="title">{t("common_title_workspace")}</Elem>
                    <EnterpriseBadge className="ml-2" />
                  </Elem>
                  <Select
                    placeholder={t("common_placeholder_select_a_option")}
                    disabled
                    options={[]}
                  />
                  <Caption>
                    {t("common_caption_for_project_workspace")}
                    <a
                      target="_blank"
                      href={createURL(
                        "https://docs.humansignal.com/guide/manage_projects#Create-workspaces-to-organize-projects",
                        {
                          experiment: "project_settings_tip",
                          treatment: "simplify_project_management",
                        },
                      )}
                      rel="noreferrer"
                    >
                      {t("common_button_learn_more")}
                    </a>
                  </Caption>
                </Block>
              )}
              <RadioGroup
                name="color"
                label={t("common_title_color")}
                size="large"
                labelProps={{ size: "large" }}
              >
                {colors.map(color => (
                  <RadioGroup.Button key={color} value={color}>
                    <Block name="color" style={{ "--background": color }} />
                  </RadioGroup.Button>
                ))}
              </RadioGroup>

              <RadioGroup
                label={t("common_title_task_Sampling")}
                labelProps={{ size: "large" }}
                name="sampling"
                simple
              >
                {samplings.map(({ value, label, description }) => (
                  <RadioGroup.Button
                    key={value}
                    value={`${value} sampling`}
                    label={`${label}${t("common_label_sampling")}`}
                    description={description}
                  />
                ))}
                {isFF(FF_LSDV_E_297) && (
                  <RadioGroup.Button
                    key="uncertainty-sampling"
                    value=""
                    label={
                      <>
                        {t("common_label_uncertainty_sampling")}
                        <EnterpriseBadge className="ml-2" />
                      </>
                    }
                    disabled
                    description={
                      <>
                        {t("common_caption_for_uncertainty_sampling")}
                        <a
                          target="_blank"
                          href={createURL("https://docs.humansignal.com/guide/active_learning", {
                              experiment: "project_settings_workspace",
                            treatment: "workspaces",
                          })}
                          rel="noreferrer"
                        >
                          {t("common_button_learn_more")}
                        </a>
                      </>
                    }
                  />
                )}
              </RadioGroup>
            </Form.Row>

            <Form.Actions>
              <Form.Indicator>
                <span case="success">{t("common_label_saved")}</span>
              </Form.Indicator>
              <Button type="submit" look="primary" style={{ width: 120 }}>
                {t("common_button_save")}
              </Button>
            </Form.Actions>
          </Form>
        </Block>
      </Elem>
      {isFF(FF_LSDV_E_297) && <HeidiTips collection="projectSettings" />}
    </Block>
  );
};

GeneralSettings.menuItem = '通用';
GeneralSettings.path = "/";
GeneralSettings.exact = true;
