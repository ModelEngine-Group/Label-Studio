import { LabelStudio } from "@humansignal/frontend-test/helpers/LSF";
import { multiChannelSampleData, multiChannwlCnfig } from "../../data/timeseries/multichannel";

describe("MultiChannel", () => {
  it("Should render", () => {
    LabelStudio.params().config(multiChannwlCnfig).data(multiChannelSampleData).withResult([]).init();
  });
});
