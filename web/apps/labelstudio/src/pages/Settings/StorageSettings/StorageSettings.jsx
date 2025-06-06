import { Columns } from "../../../components/Columns/Columns";
import { Description } from "../../../components/Description/Description";
import { Block, cn } from "../../../utils/bem";
import { Elem } from "../../../utils/bem";
import { StorageSet } from "./StorageSet";
import "./StorageSettings.scss";
import { isInLicense, LF_CLOUD_STORAGE_FOR_MANAGERS } from "../../../utils/license-flags";
import { useTranslation } from "react-i18next";

const isAllowCloudStorage = !isInLicense(LF_CLOUD_STORAGE_FOR_MANAGERS);

export const StorageSettings = () => {
  const rootClass = cn("storage-settings");
  const { t } = useTranslation();

  return isAllowCloudStorage ? (
    <Block name="storage-settings">
      <Elem name={"wrapper"}>
        <h1>{t('common_title_cloud storage')}</h1>
        <Description style={{ marginTop: 0 }}>
          Use cloud or database storage as the source for your labeling tasks or the target of your completed
          annotations.
        </Description>

        <Columns count={2} gap="40px" size="320px" className={rootClass}>
          <StorageSet title="Source Cloud Storage" buttonLabel="Add Source Storage" rootClass={rootClass} />

          <StorageSet
            title="Target Cloud Storage"
            target="export"
            buttonLabel="Add Target Storage"
            rootClass={rootClass}
          />
        </Columns>
      </Elem>
    </Block>
  ) : null;
};

StorageSettings.title = "云存储";
StorageSettings.path = "/storage";
