import { describe, expect, it } from "vitest";
import { InstanceManager } from "../../src/electron/frontend/core/components/InstanceManager";

const createInstance = () => {
  return true
}

const singleInstance = {
      instance1: createInstance
}

const multipleInstances = {
  instance1: createInstance,
  instance2: createInstance,
}

const categorizedInstances = {
  category1: {
    instance1: createInstance,
    instance2: createInstance,
  },
  category2: {
    instance3: createInstance,
    instance4: createInstance,
  }
}

describe('InstanceManager', () => {

    const mountComponent = async (props = {}) => {
        const element = new InstanceManager(props);
        document.body.appendChild(element);
        await element.updateComplete;
        return element
    }


    it('renders', async () => {
      const element = await mountComponent({ instances: singleInstance });
      expect(element.shadowRoot.querySelector('#content')).to.exist;
      expect(element.shadowRoot.querySelector('#instance-sidebar')).to.exist;
      element.remove()
    });

    it('toggles input visibility', async () => {
        const element = await mountComponent({
            instances: multipleInstances,
            onAdded: () => ({ value: createInstance })
        });

      const button = element.shadowRoot.querySelector('#add-new-button');
      const newInfoContainer = element.shadowRoot.querySelector('#new-info');
      const input = newInfoContainer.querySelector('input');
      const submitButton = newInfoContainer.querySelector('nwb-button');

      expect(newInfoContainer.hidden).to.be.true;

      button.click();
      await element.updateComplete;
      expect(newInfoContainer.hidden).to.be.false;

      input.value = 'newInstance';
      submitButton.click();
      await element.updateComplete;

      expect(newInfoContainer.hidden).to.be.true;

      // NOTE: Check for new instance
      expect(element.instances['newInstance']).to.exist;

      element.remove()
    });

    it('updates state correctly', async () => {
      const element = await mountComponent({
          instances: multipleInstances,
      });

      element.updateState('instance1', 'inactive');
      await element.updateComplete;

      const instance = element.getInstance('instance1')

      expect(instance.status).to.equal('inactive');
      element.remove()
    });

    it('selects instance on click', async () => {
      const element = await mountComponent({
        instances: multipleInstances
      });

      const instance1 = element.getInstance('instance1');
      const instance2 = element.getInstance('instance2');
      instance2.click();
      await element.updateComplete;

      expect(element.shadowRoot.querySelector(`[data-instance=${instance1.id}]`).getAttribute('hidden')).to.be.null;
      expect(element.shadowRoot.querySelector(`[data-instance=${instance2.id}]`).getAttribute('hidden')).to.exist;

      //   instance2.getAttribute('selected')).to.exist;
      // expect(instance1.getAttribute('selected')).to.be.null;

      element.remove()
    });

    it('renders accordion for categories', async () => {
        const element = await mountComponent({
            instances: categorizedInstances
        });

        await element.updateComplete;

        const accordion1 = element.shadowRoot.querySelector('nwb-accordion[name="category1"]');
        const accordion2 = element.shadowRoot.querySelector('nwb-accordion[name="instance1"]');
        expect(accordion1).to.exist;
        expect(accordion2).to.not.exist;
        element.remove()
    });
});
