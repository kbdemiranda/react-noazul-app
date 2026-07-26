import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import {AuthSplitLayout} from "../components/AuthSplitLayout.tsx";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/AuthSplitLayout">
                <AuthSplitLayout heading="Heading" description="Description">
                    <div/>
                </AuthSplitLayout>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;